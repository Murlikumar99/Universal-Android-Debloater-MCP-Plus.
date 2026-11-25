import { listInstalledApps } from './inventory';
import { getAppDetails } from './appInfo';

export interface SensitivePermissionRule {
  permission: string;
  category:
    | 'location'
    | 'camera'
    | 'microphone'
    | 'contacts'
    | 'sms_call_log'
    | 'phone_state'
    | 'storage_all_files'
    | 'accessibility'
    | 'device_admin'
    | 'notification_listener'
    | 'overlay'
    | 'install_packages'
    | 'usage_stats'
    | 'package_visibility';
  weight: number;
  rationale: string;
}

export const SENSITIVE_PERMISSIONS: Record<string, SensitivePermissionRule> = {
  'android.permission.ACCESS_BACKGROUND_LOCATION': {
    permission: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    category: 'location',
    weight: 28,
    rationale: 'Continuous background GPS tracking even when the app is closed.',
  },
  'android.permission.ACCESS_FINE_LOCATION': {
    permission: 'android.permission.ACCESS_FINE_LOCATION',
    category: 'location',
    weight: 18,
    rationale: 'Precise GPS location coordinates.',
  },
  'android.permission.ACCESS_COARSE_LOCATION': {
    permission: 'android.permission.ACCESS_COARSE_LOCATION',
    category: 'location',
    weight: 10,
    rationale: 'Approximate network/cell-tower location.',
  },
  'android.permission.CAMERA': {
    permission: 'android.permission.CAMERA',
    category: 'camera',
    weight: 20,
    rationale: 'Direct capture of photos and video.',
  },
  'android.permission.RECORD_AUDIO': {
    permission: 'android.permission.RECORD_AUDIO',
    category: 'microphone',
    weight: 22,
    rationale: 'Direct capture of ambient audio from the microphone.',
  },
  'android.permission.READ_CONTACTS': {
    permission: 'android.permission.READ_CONTACTS',
    category: 'contacts',
    weight: 16,
    rationale: 'Full read access to address book contacts.',
  },
  'android.permission.READ_SMS': {
    permission: 'android.permission.READ_SMS',
    category: 'sms_call_log',
    weight: 24,
    rationale: 'Reads SMS messages including 2FA verification codes.',
  },
  'android.permission.SEND_SMS': {
    permission: 'android.permission.SEND_SMS',
    category: 'sms_call_log',
    weight: 22,
    rationale: 'Can transmit SMS messages without user interaction.',
  },
  'android.permission.READ_CALL_LOG': {
    permission: 'android.permission.READ_CALL_LOG',
    category: 'sms_call_log',
    weight: 18,
    rationale: 'Accesses incoming and outgoing call history.',
  },
  'android.permission.READ_PHONE_STATE': {
    permission: 'android.permission.READ_PHONE_STATE',
    category: 'phone_state',
    weight: 14,
    rationale: 'Accesses cellular network state, carrier info, and device identifiers.',
  },
  'android.permission.MANAGE_EXTERNAL_STORAGE': {
    permission: 'android.permission.MANAGE_EXTERNAL_STORAGE',
    category: 'storage_all_files',
    weight: 25,
    rationale: 'Broad read/write access to all shared files on device storage.',
  },
  'android.permission.BIND_ACCESSIBILITY_SERVICE': {
    permission: 'android.permission.BIND_ACCESSIBILITY_SERVICE',
    category: 'accessibility',
    weight: 30,
    rationale: 'Can observe screen contents and simulate user touches across all apps.',
  },
  'android.permission.BIND_DEVICE_ADMIN': {
    permission: 'android.permission.BIND_DEVICE_ADMIN',
    category: 'device_admin',
    weight: 25,
    rationale: 'Device administrator privileges (lock/wipe policies and uninstall protection).',
  },
  'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE': {
    permission: 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
    category: 'notification_listener',
    weight: 24,
    rationale: 'Reads all incoming notifications from messaging and banking apps.',
  },
  'android.permission.SYSTEM_ALERT_WINDOW': {
    permission: 'android.permission.SYSTEM_ALERT_WINDOW',
    category: 'overlay',
    weight: 20,
    rationale: 'Draws overlays above other apps (potential tapjacking risk).',
  },
  'android.permission.REQUEST_INSTALL_PACKAGES': {
    permission: 'android.permission.REQUEST_INSTALL_PACKAGES',
    category: 'install_packages',
    weight: 26,
    rationale: 'Can sideload or silently stage additional APKs (when privileged).',
  },
  'android.permission.PACKAGE_USAGE_STATS': {
    permission: 'android.permission.PACKAGE_USAGE_STATS',
    category: 'usage_stats',
    weight: 16,
    rationale: 'Monitors foreground app usage frequency and habits.',
  },
  'android.permission.QUERY_ALL_PACKAGES': {
    permission: 'android.permission.QUERY_ALL_PACKAGES',
    category: 'package_visibility',
    weight: 14,
    rationale: 'Enumerates every installed app on the phone for fingerprinting or targeting.',
  },
};

export interface AppPermissionAuditEntry {
  packageName: string;
  label: string;
  isSystem: boolean;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  unusualSystemGrantFlag: boolean;
  sensitiveRequested: Array<{
    permission: string;
    category: string;
    granted: boolean;
    weight: number;
    rationale: string;
  }>;
  explanations: string[];
}

export interface PermissionAuditReport {
  serial: string;
  auditedCount: number;
  highRiskCount: number;
  flaggedSystemAppsCount: number;
  entries: AppPermissionAuditEntry[];
}

export async function auditPermissions(options?: {
  serial?: string;
  packageName?: string;
  onlyGranted?: boolean;
  minRiskScore?: number;
}): Promise<PermissionAuditReport> {
  const inventory = await listInstalledApps({ serial: options?.serial });
  const targetSerial = inventory.serial;

  const targetPackages = options?.packageName
    ? [options.packageName]
    : inventory.apps.map((a) => a.packageName);

  const entries: AppPermissionAuditEntry[] = [];

  for (const pkgName of targetPackages) {
    const details = await getAppDetails(pkgName, targetSerial);
    const sensitiveList: AppPermissionAuditEntry['sensitiveRequested'] = [];
    let rawScore = 0;

    for (const perm of details.requestedPermissions) {
      const rule = SENSITIVE_PERMISSIONS[perm];
      if (!rule) continue;
      const isGranted = details.grantedPermissions.includes(perm);
      if (options?.onlyGranted && !isGranted) continue;

      sensitiveList.push({
        permission: perm,
        category: rule.category,
        granted: isGranted,
        weight: rule.weight,
        rationale: rule.rationale,
      });

      rawScore += isGranted ? rule.weight : Math.round(rule.weight * 0.35);
    }

    const riskScore = Math.min(100, rawScore);
    const riskLevel: AppPermissionAuditEntry['riskLevel'] =
      riskScore >= 65
        ? 'Critical'
        : riskScore >= 40
          ? 'High'
          : riskScore >= 18
            ? 'Moderate'
            : 'Low';

    const explanations: string[] = [];
    const grantedCategories = new Set(sensitiveList.filter((s) => s.granted).map((s) => s.category));

    let unusualSystemGrantFlag = false;
    if (
      details.isSystem &&
      !pkgName.startsWith('com.android.systemui') &&
      !pkgName.startsWith('com.osp.') &&
      (grantedCategories.has('install_packages') ||
        (grantedCategories.has('location') && grantedCategories.has('phone_state')) ||
        grantedCategories.has('overlay'))
    ) {
      unusualSystemGrantFlag = true;
      explanations.push(
        'System-privileged package holds pre-granted telemetry, background location, or package-installer capabilities.'
      );
    }

    for (const s of sensitiveList.filter((x) => x.granted)) {
      explanations.push(`Granted ${s.permission.replace('android.permission.', '')}: ${s.rationale}`);
    }

    if (options?.minRiskScore === undefined || riskScore >= options.minRiskScore) {
      entries.push({
        packageName: details.packageName,
        label: details.label,
        isSystem: details.isSystem,
        riskScore,
        riskLevel,
        unusualSystemGrantFlag,
        sensitiveRequested: sensitiveList,
        explanations,
      });
    }
  }

  entries.sort((a, b) => b.riskScore - a.riskScore);

  return {
    serial: targetSerial,
    auditedCount: entries.length,
    highRiskCount: entries.filter((e) => e.riskLevel === 'High' || e.riskLevel === 'Critical').length,
    flaggedSystemAppsCount: entries.filter((e) => e.unusualSystemGrantFlag).length,
    entries,
  };
}
