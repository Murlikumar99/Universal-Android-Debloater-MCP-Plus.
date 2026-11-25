import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadConfig } from '../config';
import { getSubDir } from '../util/paths';
import { DebloaterError } from '../util/errors';
import { loadSavedPlan, RemovalPlan } from './planner';
import { appendAuditLog } from '../audit/auditLog';

export interface ApprovalTokenRecord {
  tokenId: string;
  tokenSecretHash: string;
  planId: string;
  planHash: string;
  serial: string;
  buildFingerprint: string;
  issuedAt: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  acknowledgedRiskyPackages: string[];
  channel: 'cli-terminal' | 'console-out-of-band';
  isMockToken?: boolean;
}

function getTokenFilePath(tokenId: string): string {
  const cleanId = tokenId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(getSubDir('approvals'), `${cleanId}.json`);
}

function hashTokenSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Out-of-band human approval issuer.
 * NEVER exposed as an MCP tool callable by the AI model (Section 6).
 * Requires the human to enter the exact confirmation phrase containing the device model and package count,
 * plus explicit risky package acknowledgement if the plan contains Risky items.
 */
export function issueHumanApprovalToken(params: {
  planId: string;
  humanConfirmationPhrase: string;
  acknowledgedRiskyPackages?: string[];
  channel: ApprovalTokenRecord['channel'];
  customTtlMs?: number;
}): {
  approvalToken: string;
  tokenId: string;
  planId: string;
  expiresAt: string;
} {
  const plan: RemovalPlan = loadSavedPlan(params.planId);

  // Double-check no Unsafe items exist
  if (plan.items.some((i) => i.category === 'Unsafe')) {
    throw new DebloaterError(
      'UNSAFE_PACKAGE_BLOCKED',
      'Cannot approve a plan containing Unsafe packages.'
    );
  }

  const expectedPhrase = plan.requiredConfirmationPhrase.trim();
  if (params.humanConfirmationPhrase.trim() !== expectedPhrase) {
    throw new DebloaterError(
      'APPROVAL_REQUIRED',
      `Confirmation phrase mismatch. Expected exact phrase: "${expectedPhrase}".`
    );
  }

  if (plan.hasRiskyItems) {
    const ackSet = new Set(params.acknowledgedRiskyPackages || []);
    for (const riskyPkg of plan.riskyPackages) {
      if (!ackSet.has(riskyPkg)) {
        throw new DebloaterError(
          'APPROVAL_REQUIRED',
          `Risky package "${riskyPkg}" requires explicit per-item human acknowledgement.`
        );
      }
    }
  }

  const cfg = loadConfig();
  const ttlMs = params.customTtlMs ?? cfg.approvalTokenTtlMs;
  const now = Date.now();
  const expiresAt = new Date(now + ttlMs).toISOString();

  const tokenId = `tok_${now}_${crypto.randomBytes(4).toString('hex')}`;
  const rawSecret = `uad_tok_${crypto.randomBytes(24).toString('hex')}`;
  const compositeToken = `${tokenId}.${rawSecret}`;

  const record: ApprovalTokenRecord = {
    tokenId,
    tokenSecretHash: hashTokenSecret(rawSecret),
    planId: plan.planId,
    planHash: plan.planHash,
    serial: plan.serial,
    buildFingerprint: plan.buildFingerprint,
    issuedAt: new Date(now).toISOString(),
    expiresAt,
    used: false,
    acknowledgedRiskyPackages: plan.riskyPackages,
    channel: params.channel,
    isMockToken: Boolean(cfg.useMockAdb),
  };

  fs.writeFileSync(getTokenFilePath(tokenId), JSON.stringify(record, null, 2), 'utf8');

  // Section 8.1: Log tokenId, NEVER the token secret
  appendAuditLog({
    eventType: 'PLAN_APPROVED',
    serial: plan.serial,
    planId: plan.planId,
    tokenId,
    summary: `Human approved plan ${plan.planId} via ${params.channel} (tokenId: ${tokenId}, expires: ${expiresAt})`,
  });

  return {
    approvalToken: compositeToken,
    tokenId,
    planId: plan.planId,
    expiresAt,
  };
}

/**
 * Validates and consumes a single-use approval token.
 */
export function validateAndConsumeApprovalToken(params: {
  approvalToken: string;
  plan: RemovalPlan;
  currentSerial: string;
  currentFingerprint: string;
  dryRun: boolean;
}): ApprovalTokenRecord {
  if (!params.approvalToken || !params.approvalToken.includes('.')) {
    throw new DebloaterError(
      'APPROVAL_INVALID_OR_EXPIRED',
      'Invalid approval token format. Run the out-of-band CLI approval command to obtain a valid token.'
    );
  }

  const [tokenId, rawSecret] = params.approvalToken.split('.');
  if (!tokenId || !rawSecret) {
    throw new DebloaterError('APPROVAL_INVALID_OR_EXPIRED', 'Malformed approval token.');
  }

  const filePath = getTokenFilePath(tokenId);
  if (!fs.existsSync(filePath)) {
    throw new DebloaterError('APPROVAL_INVALID_OR_EXPIRED', `Approval token "${tokenId}" does not exist.`);
  }

  const record = JSON.parse(fs.readFileSync(filePath, 'utf8')) as ApprovalTokenRecord;

  const actualHash = hashTokenSecret(rawSecret);
  if (actualHash !== record.tokenSecretHash) {
    throw new DebloaterError('APPROVAL_INVALID_OR_EXPIRED', 'Approval token secret verification failed.');
  }

  if (record.used) {
    throw new DebloaterError(
      'APPROVAL_INVALID_OR_EXPIRED',
      `Approval token "${tokenId}" has already been used at ${record.usedAt}. Approval tokens are strictly single-use.`
    );
  }

  if (Date.now() > new Date(record.expiresAt).getTime()) {
    throw new DebloaterError(
      'APPROVAL_INVALID_OR_EXPIRED',
      `Approval token "${tokenId}" expired at ${record.expiresAt}. Please issue a new approval.`
    );
  }

  if (record.planId !== params.plan.planId || record.planHash !== params.plan.planHash) {
    throw new DebloaterError(
      'APPROVAL_INVALID_OR_EXPIRED',
      'Approval token does not match the target plan ID or SHA-256 plan hash.'
    );
  }

  if (record.isMockToken && !loadConfig().useMockAdb) {
    throw new DebloaterError(
      'APPROVAL_INVALID_OR_EXPIRED',
      'Mock approval token cannot be used on a real hardware device.'
    );
  }

  if (record.serial !== params.currentSerial || record.buildFingerprint !== params.currentFingerprint) {
    throw new DebloaterError(
      'APPROVAL_INVALID_OR_EXPIRED',
      'Connected device serial or build fingerprint changed since the plan was approved.'
    );
  }

  // Consume token if not a dry-run (or consume on live execution; for strict single-use security, mark used when consumed in live run)
  if (!params.dryRun) {
    record.used = true;
    record.usedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
  }

  return record;
}
