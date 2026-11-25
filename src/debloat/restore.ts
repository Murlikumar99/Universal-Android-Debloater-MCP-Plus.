import fs from 'node:fs';
import path from 'node:path';
import { adbClient } from '../adb/adbClient';
import { getBackupSessionById, listBackupSessions } from './backup';
import { parseAndValidateMutatingCommand } from './executor';
import { getSubDir, safeResolveUnder } from '../util/paths';
import { assertValidPackageName, assertValidSerial } from '../util/validation';
import { appendAuditLog, readAuditLogEntries, AuditLogEntry } from '../audit/auditLog';

export interface RestorePlanItem {
  packageName: string;
  restoreCommand: string;
  reason: string;
}

export interface RestorePlan {
  restorePlanId: string;
  serial: string;
  sourceBackupId?: string;
  createdAt: string;
  items: RestorePlanItem[];
}

export interface GeneratedRestoreScripts {
  shPath: string;
  ps1Path: string;
  shContent: string;
  ps1Content: string;
}

export function generateRestoreScripts(params: {
  serial: string;
  planId: string;
  items: Array<{
    packageName: string;
    previousAction: 'uninstall-keep-data' | 'disable-user';
  }>;
}): GeneratedRestoreScripts {
  assertValidSerial(params.serial);
  for (const item of params.items) {
    assertValidPackageName(item.packageName, false);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scriptsDir = getSubDir('restore-scripts');
  const shFileName = `restore-${timestamp}-${params.planId}.sh`;
  const ps1FileName = `restore-${timestamp}-${params.planId}.ps1`;

  const shLines: string[] = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    `# Automated Restoration Script for Plan: ${params.planId}`,
    `# Target Device Serial: ${params.serial}`,
    `SERIAL="${params.serial}"`,
    'echo "Starting restoration on device $SERIAL..."',
  ];

  const ps1Lines: string[] = [
    '$ErrorActionPreference = "Stop"',
    `# Automated Restoration Script for Plan: ${params.planId}`,
    `# Target Device Serial: ${params.serial}`,
    `$Serial = "${params.serial}"`,
    'Write-Host "Starting restoration on device $Serial..."',
  ];

  for (const item of params.items) {
    if (item.previousAction === 'uninstall-keep-data') {
      shLines.push(
        `echo "Restoring ${item.packageName}..."`,
        `adb -s "$SERIAL" shell cmd package install-existing --user 0 "${item.packageName}"`,
        `adb -s "$SERIAL" shell pm enable --user 0 "${item.packageName}" || true`
      );
      ps1Lines.push(
        `Write-Host "Restoring ${item.packageName}..."`,
        `& adb -s $Serial shell cmd package install-existing --user 0 "${item.packageName}"`,
        `& adb -s $Serial shell pm enable --user 0 "${item.packageName}"`
      );
    } else {
      shLines.push(
        `echo "Re-enabling ${item.packageName}..."`,
        `adb -s "$SERIAL" shell pm enable --user 0 "${item.packageName}"`
      );
      ps1Lines.push(
        `Write-Host "Re-enabling ${item.packageName}..."`,
        `& adb -s $Serial shell pm enable --user 0 "${item.packageName}"`
      );
    }
  }

  shLines.push('echo "Restoration complete."', '');
  ps1Lines.push('Write-Host "Restoration complete."', '');

  // Enforce LF for .sh and CRLF for .ps1 (Section 10)
  const shContent = shLines.join('\n');
  const ps1Content = ps1Lines.join('\r\n');

  const shPath = safeResolveUnder(scriptsDir, shFileName);
  const ps1Path = safeResolveUnder(scriptsDir, ps1FileName);

  fs.writeFileSync(shPath, shContent, { encoding: 'utf8', mode: 0o755 });
  fs.writeFileSync(ps1Path, ps1Content, { encoding: 'utf8' });

  return {
    shPath,
    ps1Path,
    shContent,
    ps1Content,
  };
}

export async function createRestorePlan(params: {
  serial?: string;
  backupId?: string;
  packages?: string[];
  restoreAllFromAuditLog?: boolean;
}): Promise<RestorePlan> {
  const targetSerial = await adbClient.resolveTargetSerial(params.serial);
  const items: RestorePlanItem[] = [];
  const seen = new Set<string>();

  if (params.backupId) {
    const manifest = getBackupSessionById(params.backupId);
    for (const pkg of manifest.packages) {
      if (params.packages && !params.packages.includes(pkg.packageName)) continue;
      if (seen.has(pkg.packageName)) continue;
      seen.add(pkg.packageName);

      const cmd =
        pkg.previousAction === 'disable-user'
          ? `pm enable --user 0 ${pkg.packageName}`
          : `cmd package install-existing --user 0 ${pkg.packageName}`;

      items.push({
        packageName: pkg.packageName,
        restoreCommand: cmd,
        reason: `Restore from backup session ${manifest.backupId}`,
      });
    }
  } else if (params.restoreAllFromAuditLog) {
    const auditEntries = readAuditLogEntries().filter((e: AuditLogEntry) => e.eventType === 'COMMAND_EXECUTED');
    for (const entry of auditEntries) {
      if (!entry.command) continue;
      const parts = entry.command.trim().split(/\s+/);
      const pkg = parts[parts.length - 1];
      if (!pkg || seen.has(pkg)) continue;
      seen.add(pkg);
      const isDisable = entry.command.includes('disable-user');
      items.push({
        packageName: pkg,
        restoreCommand: isDisable
          ? `pm enable --user 0 ${pkg}`
          : `cmd package install-existing --user 0 ${pkg}`,
        reason: `Restore package modified in audit log entry #${entry.index}`,
      });
    }
  } else if (params.packages && params.packages.length > 0) {
    for (const pkg of params.packages) {
      assertValidPackageName(pkg, false);
      if (seen.has(pkg)) continue;
      seen.add(pkg);
      items.push({
        packageName: pkg,
        restoreCommand: `cmd package install-existing --user 0 ${pkg}`,
        reason: 'Direct package restoration request',
      });
    }
  } else {
    const sessions = listBackupSessions(targetSerial);
    if (sessions[0]) {
      for (const pkg of sessions[0].packages) {
        if (seen.has(pkg.packageName)) continue;
        seen.add(pkg.packageName);
        items.push({
          packageName: pkg.packageName,
          restoreCommand:
            pkg.previousAction === 'disable-user'
              ? `pm enable --user 0 ${pkg.packageName}`
              : `cmd package install-existing --user 0 ${pkg.packageName}`,
          reason: `Restore from latest backup ${sessions[0].backupId}`,
        });
      }
    }
  }

  return {
    restorePlanId: `rst_${Date.now()}`,
    serial: targetSerial,
    sourceBackupId: params.backupId,
    createdAt: new Date().toISOString(),
    items,
  };
}

export async function executeRestorePlan(params: {
  serial?: string;
  packages: Array<{
    packageName: string;
    restoreCommand?: string;
  }>;
}): Promise<{
  serial: string;
  restoredCount: number;
  results: Array<{
    packageName: string;
    command: string;
    success: boolean;
    output: string;
  }>;
}> {
  const targetSerial = await adbClient.resolveTargetSerial(params.serial);
  const results: Array<{
    packageName: string;
    command: string;
    success: boolean;
    output: string;
  }> = [];

  for (const item of params.packages) {
    assertValidPackageName(item.packageName, false);
    const cmd = item.restoreCommand || `cmd package install-existing --user 0 ${item.packageName}`;
    const validated = parseAndValidateMutatingCommand(cmd);
    const { result } = await adbClient.runShell(targetSerial, validated.shellArgs);

    // Also ensure package is enabled
    await adbClient.runShell(targetSerial, ['pm', 'enable', '--user', '0', item.packageName]);

    const success = result.exitCode === 0;
    results.push({
      packageName: item.packageName,
      command: cmd,
      success,
      output: `${result.stdout}\n${result.stderr}`.trim(),
    });

    appendAuditLog({
      eventType: 'RESTORE_EXECUTED',
      serial: targetSerial,
      command: cmd,
      exitCode: result.exitCode,
      summary: `Restored package "${item.packageName}" on ${targetSerial} (success=${success})`,
    });
  }

  return {
    serial: targetSerial,
    restoredCount: results.filter((r) => r.success).length,
    results,
  };
}
