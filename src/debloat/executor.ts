import { adbClient } from '../adb/adbClient';
import { getDeviceProfile } from '../device/profile';
import { getDeviceResourceUsage, DeviceResourceSnapshot } from '../device/resources';
import { parseSimplePackageList } from '../adb/parsers';
import { explainPackageClassification } from './safetyEngine';
import { loadSavedPlan } from './planner';
import { validateAndConsumeApprovalToken } from './approval';
import { createPackageBackups, BackupSessionManifest } from './backup';
import { generateRestoreScripts, GeneratedRestoreScripts } from './restore';
import { loadConfig } from '../config';
import { DebloaterError } from '../util/errors';
import { assertValidPackageName, PACKAGE_NAME_REGEX } from '../util/validation';
import { appendAuditLog } from '../audit/auditLog';

/**
 * Section 7.1: Exhaustive allowlist of mutating shell commands.
 * Any other command through the mutating path MUST throw PROHIBITED_COMMAND.
 */
const ALLOWED_MUTATING_TEMPLATES: Array<{
  name: string;
  regex: RegExp;
  buildArgs: (packageName: string) => string[];
}> = [
  {
    name: 'uninstall-keep-data',
    regex: /^pm uninstall -k --user 0 ([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)$/,
    buildArgs: (pkg) => ['pm', 'uninstall', '-k', '--user', '0', pkg],
  },
  {
    name: 'disable-user',
    regex: /^pm disable-user --user 0 ([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)$/,
    buildArgs: (pkg) => ['pm', 'disable-user', '--user', '0', pkg],
  },
  {
    name: 'install-existing-cmd',
    regex: /^cmd package install-existing --user 0 ([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)$/,
    buildArgs: (pkg) => ['cmd', 'package', 'install-existing', '--user', '0', pkg],
  },
  {
    name: 'install-existing-pm',
    regex: /^pm install-existing --user 0 ([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)$/,
    buildArgs: (pkg) => ['pm', 'install-existing', '--user', '0', pkg],
  },
  {
    name: 'enable-package',
    regex: /^pm enable --user 0 ([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)$/,
    buildArgs: (pkg) => ['pm', 'enable', '--user', '0', pkg],
  },
];

/**
 * Validates a mutating command string against the exhaustive allowlist.
 * Throws PROHIBITED_COMMAND for any command not matching the allowlist (e.g., pm uninstall without -k,
 * pm clear, pm hide, rm, su, root, reboot bootloader, settings put, fastboot, shell metacharacters).
 */
export function parseAndValidateMutatingCommand(command: string): {
  templateName: string;
  packageName: string;
  shellArgs: string[];
} {
  const trimmed = command.trim();
  for (const tpl of ALLOWED_MUTATING_TEMPLATES) {
    const match = tpl.regex.exec(trimmed);
    if (match && match[1]) {
      const pkg = match[1];
      if (!PACKAGE_NAME_REGEX.test(pkg) || pkg === 'android') {
        throw new DebloaterError(
          'INVALID_PACKAGE_NAME',
          `Package "${pkg}" failed strict package-name regex validation.`
        );
      }
      return {
        templateName: tpl.name,
        packageName: pkg,
        shellArgs: tpl.buildArgs(pkg),
      };
    }
  }

  throw new DebloaterError(
    'PROHIBITED_COMMAND',
    `Prohibited mutating command rejected by executor policy: "${command}". Only allowlisted user-0 package commands with -k are permitted.`
  );
}

export interface DeviceHealthCheckResult {
  healthy: boolean;
  bootCompleted: boolean;
  systemUiResponsive: boolean;
  details: string;
}

export async function verifyDeviceHealth(serial: string): Promise<DeviceHealthCheckResult> {
  try {
    const [bootRes, sysUiRes] = await Promise.all([
      adbClient.runShell(serial, ['getprop', 'sys.boot_completed']),
      adbClient.runShell(serial, ['dumpsys', 'activity', 'services', 'com.android.systemui']),
    ]);

    const bootCompleted = bootRes.result.stdout.trim() === '1';
    const systemUiResponsive =
      sysUiRes.result.exitCode === 0 && !sysUiRes.result.stdout.includes('(nothing)');
    const healthy = bootCompleted && systemUiResponsive;

    return {
      healthy,
      bootCompleted,
      systemUiResponsive,
      details: healthy
        ? 'Device online, sys.boot_completed=1, SystemUI service responsive.'
        : `Health check failed (boot_completed=${bootCompleted}, systemUiResponsive=${systemUiResponsive}).`,
    };
  } catch (err) {
    return {
      healthy: false,
      bootCompleted: false,
      systemUiResponsive: false,
      details: `Device disconnected or unresponsive during health check: ${(err as Error).message}`,
    };
  }
}

export interface CommandExecutionRecord {
  packageName: string;
  command: string;
  dryRun: boolean;
  executed: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  verifiedPostState: boolean;
  verificationNote: string;
}

export interface ExecutePlanResponse {
  planId: string;
  serial: string;
  dryRun: boolean;
  tokenId: string;
  backupManifest?: BackupSessionManifest;
  restoreScripts?: GeneratedRestoreScripts;
  baselineResources: DeviceResourceSnapshot;
  afterResources: DeviceResourceSnapshot;
  results: CommandExecutionRecord[];
  healthCheck: DeviceHealthCheckResult;
  abortedMidBatch: boolean;
  abortReason?: string;
}

export async function executeApprovedPlan(params: {
  planId: string;
  approvalToken: string;
  dryRun?: boolean;
  serial?: string;
}): Promise<ExecutePlanResponse> {
  const cfg = loadConfig();
  const dryRun = params.dryRun ?? cfg.defaultDryRun;

  const plan = loadSavedPlan(params.planId);
  const targetSerial = params.serial || plan.serial;
  const profile = await getDeviceProfile(targetSerial);

  // 1. Validate & consume human approval token
  const tokenRecord = validateAndConsumeApprovalToken({
    approvalToken: params.approvalToken,
    plan,
    currentSerial: profile.serial,
    currentFingerprint: profile.buildFingerprint,
    dryRun,
  });

  // 2. Defense-in-depth: Re-run safety engine for every package BEFORE doing anything
  for (const item of plan.items) {
    assertValidPackageName(item.packageName, false);
    parseAndValidateMutatingCommand(item.exactCommand);
    const liveVerdict = await explainPackageClassification(item.packageName, profile.serial);
    if (liveVerdict.category === 'Unsafe') {
      appendAuditLog({
        eventType: 'SECURITY_ALERT',
        serial: profile.serial,
        planId: plan.planId,
        tokenId: tokenRecord.tokenId,
        summary: `Executor defense-in-depth blocked Unsafe package "${item.packageName}" prior to execution.`,
      });
      throw new DebloaterError(
        'UNSAFE_PACKAGE_BLOCKED',
        `Defense-in-depth abort: package "${item.packageName}" evaluated as Unsafe prior to execution (${liveVerdict.blockedBy}).`
      );
    }
  }

  const baselineResources = await getDeviceResourceUsage(profile.serial);

  let backupManifest: BackupSessionManifest | undefined;
  let restoreScripts: GeneratedRestoreScripts | undefined;

  if (!dryRun) {
    // 3. Create verified backups before first mutating command (Section 7.2)
    backupManifest = await createPackageBackups({
      serial: profile.serial,
      packages: plan.items.map((i) => ({ packageName: i.packageName, action: i.action })),
    });
    restoreScripts = generateRestoreScripts({
      serial: profile.serial,
      planId: plan.planId,
      items: plan.items.map((i) => ({ packageName: i.packageName, previousAction: i.action })),
    });
  }

  const results: CommandExecutionRecord[] = [];
  let abortedMidBatch = false;
  let abortReason: string | undefined;
  let lastHealthCheck: DeviceHealthCheckResult = {
    healthy: true,
    bootCompleted: true,
    systemUiResponsive: true,
    details: 'Dry-run mode: no device mutations performed.',
  };

  for (let idx = 0; idx < plan.items.length; idx++) {
    const item = plan.items[idx]!;
    const validated = parseAndValidateMutatingCommand(item.exactCommand);

    if (dryRun) {
      results.push({
        packageName: item.packageName,
        command: `adb -s ${profile.serial} shell ${validated.shellArgs.join(' ')}`,
        dryRun: true,
        executed: false,
        exitCode: 0,
        stdout: `[DRY-RUN] Would execute: adb -s ${profile.serial} shell ${validated.shellArgs.join(' ')}`,
        stderr: '',
        verifiedPostState: true,
        verificationNote: 'Dry-run preview only; device state unchanged.',
      });
      continue;
    }

    try {
      const execRes = await adbClient.runShell(profile.serial, validated.shellArgs);

      // Post-execution verification (Section 7.4)
      let verifiedPostState = false;
      let verificationNote = '';

      if (item.action === 'uninstall-keep-data') {
        const listAfter = await adbClient.runShell(profile.serial, ['pm', 'list', 'packages', '--user', '0']);
        const installedSet = parseSimplePackageList(listAfter.result.stdout);
        verifiedPostState = !installedSet.has(item.packageName);
        verificationNote = verifiedPostState
          ? 'Verified absent from user 0 package list.'
          : 'Mismatch: package still appears in user 0 package list.';
      } else {
        const disAfter = await adbClient.runShell(profile.serial, ['pm', 'list', 'packages', '-d', '--user', '0']);
        const disabledSet = parseSimplePackageList(disAfter.result.stdout);
        verifiedPostState = disabledSet.has(item.packageName);
        verificationNote = verifiedPostState
          ? 'Verified present in disabled packages list for user 0.'
          : 'Mismatch: package not marked disabled for user 0.';
      }

      results.push({
        packageName: item.packageName,
        command: item.exactCommand,
        dryRun: false,
        executed: true,
        exitCode: execRes.result.exitCode,
        stdout: execRes.result.stdout.trim(),
        stderr: execRes.result.stderr.trim(),
        verifiedPostState,
        verificationNote,
      });

      appendAuditLog({
        eventType: 'COMMAND_EXECUTED',
        serial: profile.serial,
        planId: plan.planId,
        tokenId: tokenRecord.tokenId,
        command: item.exactCommand,
        exitCode: execRes.result.exitCode,
        summary: `Executed "${item.exactCommand}" (exit=${execRes.result.exitCode}, verified=${verifiedPostState})`,
      });
    } catch (err) {
      abortedMidBatch = true;
      abortReason = `Command failed mid-batch on package "${item.packageName}": ${(err as Error).message}`;
      lastHealthCheck = {
        healthy: false,
        bootCompleted: false,
        systemUiResponsive: false,
        details: abortReason,
      };
      break;
    }

    // Batch health check every N packages or at end of plan
    const isBatchBoundary = (idx + 1) % cfg.healthCheckIntervalBatch === 0 || idx === plan.items.length - 1;
    if (isBatchBoundary) {
      lastHealthCheck = await verifyDeviceHealth(profile.serial);
      if (!lastHealthCheck.healthy) {
        abortedMidBatch = true;
        abortReason = `Device health check failed after package "${item.packageName}": ${lastHealthCheck.details}. Batch halted; use execute_restore to roll back.`;
        break;
      }
    }
  }

  let afterResources = baselineResources;
  if (!abortedMidBatch) {
    try {
      afterResources = await getDeviceResourceUsage(profile.serial);
    } catch {
      afterResources = baselineResources;
    }
  }

  return {
    planId: plan.planId,
    serial: profile.serial,
    dryRun,
    tokenId: tokenRecord.tokenId,
    backupManifest,
    restoreScripts,
    baselineResources,
    afterResources,
    results,
    healthCheck: lastHealthCheck,
    abortedMidBatch,
    abortReason,
  };
}
