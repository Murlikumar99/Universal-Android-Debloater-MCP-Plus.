import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDeviceProfile } from '../device/profile';
import { explainPackageClassification } from './safetyEngine';
import { SafetyCategory } from './lists/normalize';
import { loadConfig } from '../config';
import { getSubDir } from '../util/paths';
import { DebloaterError } from '../util/errors';
import { assertValidPackageName } from '../util/validation';
import { appendAuditLog } from '../audit/auditLog';

export type RemovalActionType = 'uninstall-keep-data' | 'disable-user';

export interface RemovalPlanItem {
  packageName: string;
  label: string;
  action: RemovalActionType;
  category: SafetyCategory;
  reasons: string[];
  sources: string[];
  backupRequired: true;
  restorableViaInstallExisting: boolean;
  exactCommand: string;
}

export interface RemovalPlan {
  planId: string;
  createdAt: string;
  serial: string;
  deviceModel: string;
  manufacturer: string;
  buildFingerprint: string;
  items: RemovalPlanItem[];
  hasRiskyItems: boolean;
  riskyPackages: string[];
  planHash: string;
  requiredConfirmationPhrase: string;
  cliApproveCommand: string;
}

export function computePlanHash(plan: Omit<RemovalPlan, 'planHash' | 'requiredConfirmationPhrase' | 'cliApproveCommand'>): string {
  const canonical = JSON.stringify({
    planId: plan.planId,
    serial: plan.serial,
    buildFingerprint: plan.buildFingerprint,
    items: plan.items.map((i) => ({
      packageName: i.packageName,
      action: i.action,
      category: i.category,
      exactCommand: i.exactCommand,
    })),
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function getPlanFilePath(planId: string): string {
  const cleanId = planId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(getSubDir('plans'), `${cleanId}.json`);
}

export function loadSavedPlan(planId: string): RemovalPlan {
  const filePath = getPlanFilePath(planId);
  if (!fs.existsSync(filePath)) {
    throw new DebloaterError('COMMAND_FAILED', `Removal plan "${planId}" was not found.`);
  }
  const plan = JSON.parse(fs.readFileSync(filePath, 'utf8')) as RemovalPlan;
  const recomputedHash = computePlanHash(plan);
  if (recomputedHash !== plan.planHash) {
    throw new DebloaterError(
      'APPROVAL_INVALID_OR_EXPIRED',
      `Plan "${planId}" failed integrity verification: plan content was mutated after creation.`
    );
  }
  return plan;
}

export function listSavedPlans(): RemovalPlan[] {
  const dir = getSubDir('plans');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const plans: RemovalPlan[] = [];
  for (const f of files) {
    try {
      const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as RemovalPlan;
      plans.push(p);
    } catch {
      // skip invalid file
    }
  }
  return plans.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createRemovalPlan(params: {
  serial?: string;
  packages: Array<{
    packageName: string;
    action?: RemovalActionType;
  }>;
  acknowledgeRisky?: boolean;
}): Promise<RemovalPlan> {
  const cfg = loadConfig();
  if (!params.packages || params.packages.length === 0) {
    throw new DebloaterError('COMMAND_FAILED', 'At least one package must be specified to create a removal plan.');
  }
  if (params.packages.length > cfg.maxBatchSize) {
    throw new DebloaterError(
      'COMMAND_FAILED',
      `Batch size limit exceeded: requested ${params.packages.length} packages, maximum allowed per plan is ${cfg.maxBatchSize}.`
    );
  }

  const profile = await getDeviceProfile(params.serial);
  const items: RemovalPlanItem[] = [];
  const riskyPackages: string[] = [];

  for (const reqItem of params.packages) {
    assertValidPackageName(reqItem.packageName, true);
    const verdict = await explainPackageClassification(reqItem.packageName, profile.serial);

    // Section 5.1 & 5.5: Unsafe packages MUST NEVER be planned under any circumstances
    if (verdict.category === 'Unsafe') {
      throw new DebloaterError(
        'UNSAFE_PACKAGE_BLOCKED',
        `Refusing to plan removal of Unsafe package "${reqItem.packageName}" (${verdict.blockedBy || 'protected'}): ${verdict.reasons.join(' ')}`
      );
    }

    assertValidPackageName(reqItem.packageName, false);

    if (verdict.category === 'Risky') {
      riskyPackages.push(reqItem.packageName);
    }

    const action: RemovalActionType =
      reqItem.action ||
      (verdict.recommendedAction === 'uninstall-keep-data' ? 'uninstall-keep-data' : 'disable-user');

    const exactCommand =
      action === 'uninstall-keep-data'
        ? `pm uninstall -k --user 0 ${reqItem.packageName}`
        : `pm disable-user --user 0 ${reqItem.packageName}`;

    items.push({
      packageName: reqItem.packageName,
      label: verdict.label,
      action,
      category: verdict.category,
      reasons: verdict.reasons,
      sources: verdict.sources,
      backupRequired: true,
      restorableViaInstallExisting: verdict.isSystem,
      exactCommand,
    });
  }

  if (riskyPackages.length > 0 && !params.acknowledgeRisky) {
    throw new DebloaterError(
      'APPROVAL_REQUIRED',
      `Plan includes ${riskyPackages.length} Risky package(s) (${riskyPackages.join(', ')}). Pass "acknowledgeRisky: true" to confirm you understand the risk of breaking vendor features.`
    );
  }

  const planId = `plan_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const draft = {
    planId,
    createdAt: new Date().toISOString(),
    serial: profile.serial,
    deviceModel: profile.model,
    manufacturer: profile.manufacturer,
    buildFingerprint: profile.buildFingerprint,
    items,
    hasRiskyItems: riskyPackages.length > 0,
    riskyPackages,
  };

  const planHash = computePlanHash(draft);
  const requiredConfirmationPhrase = `APPROVE ${profile.model} ${items.length} PACKAGES`;
  const cliApproveCommand = `npx tsx src/index.ts approve ${planId}`;

  const fullPlan: RemovalPlan = {
    ...draft,
    planHash,
    requiredConfirmationPhrase,
    cliApproveCommand,
  };

  fs.writeFileSync(getPlanFilePath(planId), JSON.stringify(fullPlan, null, 2), 'utf8');

  appendAuditLog({
    eventType: 'PLAN_CREATED',
    serial: profile.serial,
    planId,
    summary: `Created removal plan ${planId} for ${items.length} package(s) on ${profile.model} (hash: ${planHash.slice(0, 12)})`,
    details: {
      packageCount: items.length,
      packages: items.map((i) => ({ pkg: i.packageName, action: i.action, category: i.category })),
    },
  });

  return fullPlan;
}
