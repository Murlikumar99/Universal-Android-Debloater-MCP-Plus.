import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getSubDir } from '../util/paths';
import { redactSensitiveText } from '../util/redact';

export interface AuditLogEntry {
  index: number;
  timestamp: string;
  eventType:
    | 'TOOL_CALL'
    | 'PLAN_CREATED'
    | 'PLAN_APPROVED'
    | 'BACKUP_COMPLETED'
    | 'COMMAND_EXECUTED'
    | 'RESTORE_EXECUTED'
    | 'SECURITY_ALERT';
  deviceSerialHash?: string;
  planId?: string;
  tokenId?: string;
  command?: string;
  exitCode?: number;
  summary: string;
  details?: Record<string, unknown>;
  prevHash: string;
  entryHash: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  totalEntries: number;
  firstEntryTimestamp?: string;
  lastEntryTimestamp?: string;
  headHash: string;
  tamperedAtIndex?: number;
  errorReason?: string;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function getAuditLogPath(): string {
  return path.join(getSubDir('audit'), 'audit-log.jsonl');
}

function computeEntryHash(payloadWithoutEntryHash: Omit<AuditLogEntry, 'entryHash'>): string {
  const canonical = JSON.stringify({
    index: payloadWithoutEntryHash.index,
    timestamp: payloadWithoutEntryHash.timestamp,
    eventType: payloadWithoutEntryHash.eventType,
    deviceSerialHash: payloadWithoutEntryHash.deviceSerialHash ?? null,
    planId: payloadWithoutEntryHash.planId ?? null,
    tokenId: payloadWithoutEntryHash.tokenId ?? null,
    command: payloadWithoutEntryHash.command ?? null,
    exitCode: payloadWithoutEntryHash.exitCode ?? null,
    summary: payloadWithoutEntryHash.summary,
    details: payloadWithoutEntryHash.details ?? null,
    prevHash: payloadWithoutEntryHash.prevHash,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function readAuditLogEntries(): AuditLogEntry[] {
  const filePath = getAuditLogPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditLogEntry);
}

export function appendAuditLog(params: {
  eventType: AuditLogEntry['eventType'];
  serial?: string;
  planId?: string;
  tokenId?: string;
  command?: string;
  exitCode?: number;
  summary: string;
  details?: Record<string, unknown>;
}): AuditLogEntry {
  const existing = readAuditLogEntries();
  const prevHash = existing.length > 0 ? existing[existing.length - 1]!.entryHash : GENESIS_HASH;
  const index = existing.length;

  const deviceSerialHash = params.serial
    ? crypto.createHash('sha256').update(params.serial).digest('hex').slice(0, 12)
    : undefined;

  const redactedSummary = redactSensitiveText(params.summary, true, params.serial);

  const draft: Omit<AuditLogEntry, 'entryHash'> = {
    index,
    timestamp: new Date().toISOString(),
    eventType: params.eventType,
    deviceSerialHash,
    planId: params.planId,
    tokenId: params.tokenId,
    command: params.command ? redactSensitiveText(params.command, true, params.serial) : undefined,
    exitCode: params.exitCode,
    summary: redactedSummary,
    details: params.details,
    prevHash,
  };

  const entryHash = computeEntryHash(draft);
  const fullEntry: AuditLogEntry = { ...draft, entryHash };

  const filePath = getAuditLogPath();
  fs.appendFileSync(filePath, JSON.stringify(fullEntry) + '\n', 'utf8');
  return fullEntry;
}

export function verifyAuditLogIntegrity(): AuditVerificationResult {
  const entries = readAuditLogEntries();
  if (entries.length === 0) {
    return {
      valid: true,
      totalEntries: 0,
      headHash: GENESIS_HASH,
    };
  }

  let expectedPrevHash = GENESIS_HASH;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    if (entry.index !== i) {
      return {
        valid: false,
        totalEntries: entries.length,
        headHash: entries[entries.length - 1]!.entryHash,
        tamperedAtIndex: i,
        errorReason: `Sequence index mismatch at line ${i}: expected ${i}, found ${entry.index}.`,
      };
    }
    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        headHash: entries[entries.length - 1]!.entryHash,
        tamperedAtIndex: i,
        errorReason: `Broken hash chain at index ${i}: prevHash does not match previous entryHash.`,
      };
    }
    const recomputed = computeEntryHash(entry);
    if (recomputed !== entry.entryHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        headHash: entries[entries.length - 1]!.entryHash,
        tamperedAtIndex: i,
        errorReason: `Entry payload tampering detected at index ${i}: computed SHA-256 (${recomputed}) != stored entryHash (${entry.entryHash}).`,
      };
    }
    expectedPrevHash = entry.entryHash;
  }

  return {
    valid: true,
    totalEntries: entries.length,
    firstEntryTimestamp: entries[0]?.timestamp,
    lastEntryTimestamp: entries[entries.length - 1]?.timestamp,
    headHash: expectedPrevHash,
  };
}
