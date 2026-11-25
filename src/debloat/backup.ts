import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { adbClient } from '../adb/adbClient';
import { getDeviceProfile } from '../device/profile';
import { getAppDetails } from '../apps/appInfo';
import { getSubDir, hashSerial, safeResolveUnder } from '../util/paths';
import { assertValidPackageName } from '../util/validation';
import { DebloaterError } from '../util/errors';
import { appendAuditLog } from '../audit/auditLog';

export interface BackedUpPackageRecord {
  packageName: string;
  label: string;
  versionName: string;
  versionCode: number;
  isSystem: boolean;
  enabledBeforeChange: boolean;
  installerPackageName?: string;
  grantedPermissions: string[];
  remoteApkPaths: string[];
  pulledFiles: Array<{
    fileName: string;
    localRelativePath: string;
    sizeBytes: number;
    sha256: string;
  }>;
  apkPullSucceeded: boolean;
  pullWarning?: string;
  restorableViaInstallExisting: boolean;
  previousAction?: 'uninstall-keep-data' | 'disable-user';
}

export interface BackupSessionManifest {
  backupId: string;
  createdAt: string;
  serialHash: string;
  serial: string;
  deviceModel: string;
  manufacturer: string;
  androidVersion: string;
  buildFingerprint: string;
  backupDir: string;
  packages: BackedUpPackageRecord[];
}

export async function createPackageBackups(params: {
  serial?: string;
  packages: Array<{
    packageName: string;
    action?: 'uninstall-keep-data' | 'disable-user';
  }>;
}): Promise<BackupSessionManifest> {
  const profile = await getDeviceProfile(params.serial);
  const serialHash = hashSerial(profile.serial);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = `bkp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const backupsRoot = getSubDir('backups');
  const sessionRelPath = path.join(serialHash, `${timestamp}_${backupId}`);
  const sessionDir = safeResolveUnder(backupsRoot, sessionRelPath);
  fs.mkdirSync(sessionDir, { recursive: true });

  const backedUpPackages: BackedUpPackageRecord[] = [];

  for (const item of params.packages) {
    assertValidPackageName(item.packageName, false);
    const details = await getAppDetails(item.packageName, profile.serial);
    const pkgDir = safeResolveUnder(sessionDir, item.packageName);
    fs.mkdirSync(pkgDir, { recursive: true });

    const pathRes = await adbClient.runShell(profile.serial, ['pm', 'path', item.packageName]);
    const remotePaths = pathRes.result.stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('package:'))
      .map((l) => l.slice('package:'.length).trim());

    const effectiveRemotePaths = remotePaths.length > 0 ? remotePaths : details.apkPaths;
    const pulledFiles: BackedUpPackageRecord['pulledFiles'] = [];
    let apkPullSucceeded = true;
    let pullWarning: string | undefined;

    for (let i = 0; i < effectiveRemotePaths.length; i++) {
      const remotePath = effectiveRemotePaths[i]!;
      const fileName = i === 0 ? 'base.apk' : `split_${i}.apk`;
      const localApkPath = safeResolveUnder(pkgDir, fileName);

      const pullRes = await adbClient.runAdb(['-s', profile.serial, 'pull', remotePath, localApkPath]);
      if (pullRes.exitCode !== 0 || !fs.existsSync(localApkPath)) {
        apkPullSucceeded = false;
        pullWarning = `Failed to pull APK "${remotePath}": ${pullRes.stderr.trim() || 'permission denied'}`;
        break;
      }

      const stat = fs.statSync(localApkPath);
      if (stat.size <= 0) {
        apkPullSucceeded = false;
        pullWarning = `Pulled APK "${fileName}" has 0 bytes.`;
        break;
      }

      const fileBuf = fs.readFileSync(localApkPath);
      const sha256 = crypto.createHash('sha256').update(fileBuf).digest('hex');

      pulledFiles.push({
        fileName,
        localRelativePath: path.relative(sessionDir, localApkPath),
        sizeBytes: stat.size,
        sha256,
      });
    }

    // Section 7.2: If APK pull fails and package is NOT restorable via install-existing (i.e. not a system app), abort!
    const restorableViaInstallExisting = details.isSystem;
    if (!apkPullSucceeded && !restorableViaInstallExisting) {
      throw new DebloaterError(
        'BACKUP_FAILED',
        `Backup failed for third-party package "${item.packageName}" (${pullWarning}) and it cannot be restored via install-existing. Aborting before any device modification.`
      );
    }

    const record: BackedUpPackageRecord = {
      packageName: item.packageName,
      label: details.label,
      versionName: details.versionName,
      versionCode: details.versionCode,
      isSystem: details.isSystem,
      enabledBeforeChange: details.enabled,
      installerPackageName: details.installerPackageName,
      grantedPermissions: details.grantedPermissions,
      remoteApkPaths: effectiveRemotePaths,
      pulledFiles,
      apkPullSucceeded,
      pullWarning:
        !apkPullSucceeded && restorableViaInstallExisting
          ? `${pullWarning}. Proceeding because "${item.packageName}" is a system image package restorable via "cmd package install-existing --user 0".`
          : undefined,
      restorableViaInstallExisting,
      previousAction: item.action,
    };

    fs.writeFileSync(
      safeResolveUnder(pkgDir, 'metadata.json'),
      JSON.stringify(record, null, 2),
      'utf8'
    );
    backedUpPackages.push(record);
  }

  const manifest: BackupSessionManifest = {
    backupId,
    createdAt: new Date().toISOString(),
    serialHash,
    serial: profile.serial,
    deviceModel: profile.model,
    manufacturer: profile.manufacturer,
    androidVersion: profile.androidVersion,
    buildFingerprint: profile.buildFingerprint,
    backupDir: sessionDir,
    packages: backedUpPackages,
  };

  fs.writeFileSync(
    safeResolveUnder(sessionDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  appendAuditLog({
    eventType: 'BACKUP_COMPLETED',
    serial: profile.serial,
    summary: `Created verified backup ${backupId} for ${backedUpPackages.length} package(s) on ${profile.model}`,
    details: {
      backupId,
      packages: backedUpPackages.map((p) => ({
        packageName: p.packageName,
        apkPullSucceeded: p.apkPullSucceeded,
        files: p.pulledFiles.map((f) => ({ fileName: f.fileName, sha256: f.sha256, sizeBytes: f.sizeBytes })),
      })),
    },
  });

  return manifest;
}

export function listBackupSessions(serial?: string): BackupSessionManifest[] {
  const backupsRoot = getSubDir('backups');
  const results: BackupSessionManifest[] = [];
  if (!fs.existsSync(backupsRoot)) return results;

  for (const serialDir of fs.readdirSync(backupsRoot)) {
    const serialFullPath = safeResolveUnder(backupsRoot, serialDir);
    if (!fs.statSync(serialFullPath).isDirectory()) continue;

    for (const sessionFolder of fs.readdirSync(serialFullPath)) {
      const manifestPath = safeResolveUnder(serialFullPath, path.join(sessionFolder, 'manifest.json'));
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as BackupSessionManifest;
          if (!serial || manifest.serial === serial) {
            results.push(manifest);
          }
        } catch {
          // ignore malformed manifest
        }
      }
    }
  }

  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBackupSessionById(backupId: string): BackupSessionManifest {
  const all = listBackupSessions();
  const found = all.find((b) => b.backupId === backupId);
  if (!found) {
    throw new DebloaterError('COMMAND_FAILED', `Backup session "${backupId}" was not found.`);
  }
  return found;
}
