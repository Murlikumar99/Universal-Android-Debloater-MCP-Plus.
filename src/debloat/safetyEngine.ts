import { adbClient } from '../adb/adbClient';
import { getDeviceProfile } from '../device/profile';
import { listInstalledApps, inferHumanLabel } from '../apps/inventory';
import { getAppDetails } from '../apps/appInfo';
import { lookupPackageInLists } from './lists/cache';
import { pickMoreConservativeCategory, SafetyCategory } from './lists/normalize';
import { checkProtectedPackage, LiveDeviceProtectionContext } from './protectedPackages';
import { evaluateOemRules } from './classifier';

export interface PackageSafetyVerdict {
  packageName: string;
  label: string;
  category: SafetyCategory;
  reasons: string[];
  sources: string[];
  blockedBy?: string;
  confidence: 'high' | 'medium' | 'low';
  recommendedAction: 'uninstall-keep-data' | 'disable-user' | 'keep-installed';
  dependencies: string[];
  neededBy: string[];
  isSystem: boolean;
  enabled: boolean;
  apkSizeBytes?: number;
}

export async function gatherLiveProtectionContext(
  serial: string,
  sharedUserId?: string
): Promise<LiveDeviceProtectionContext> {
  const rolesToCheck = [
    'android.app.role.HOME',
    'android.app.role.DIALER',
    'android.app.role.SMS',
    'android.app.role.BROWSER',
  ];

  const roleHolders: Record<string, string[]> = {};
  for (const role of rolesToCheck) {
    try {
      const { result } = await adbClient.runShell(serial, ['cmd', 'role', 'get-role-holders', role]);
      const holders = result.stdout
        .trim()
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      if (holders.length > 0) {
        roleHolders[role] = holders;
      }
    } catch {
      // Ignore if role command is unsupported on older API
    }
  }

  let activeInputMethods: string[] = [];
  try {
    const { result } = await adbClient.runShell(serial, ['ime', 'list', '-a', '-s']);
    activeInputMethods = result.stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    activeInputMethods = [];
  }

  let enabledAccessibilityPackages: string[] = [];
  try {
    const { result } = await adbClient.runShell(serial, [
      'settings',
      'get',
      'secure',
      'enabled_accessibility_services',
    ]);
    const raw = result.stdout.trim();
    if (raw && raw !== 'null') {
      enabledAccessibilityPackages = raw
        .split(':')
        .map((part) => part.split('/')[0]?.trim() || '')
        .filter(Boolean);
    }
  } catch {
    enabledAccessibilityPackages = [];
  }

  return {
    roleHolders,
    activeInputMethods,
    enabledAccessibilityPackages,
    sharedUserId,
  };
}

/**
 * Pure deterministic safety evaluation function (unit-testable without ADB).
 */
export function computeSafetyVerdict(params: {
  packageName: string;
  label?: string;
  isSystem?: boolean;
  enabled?: boolean;
  apkSizeBytes?: number;
  deviceManufacturer?: string;
  liveContext?: LiveDeviceProtectionContext;
}): PackageSafetyVerdict {
  const {
    packageName,
    label = inferHumanLabel(packageName),
    isSystem = true,
    enabled = true,
    apkSizeBytes,
    deviceManufacturer,
    liveContext,
  } = params;

  const reasons: string[] = [];
  const sources: string[] = [];

  // 1. Check hard-protected rules and live role/IME/sharedUserId rules first (always Unsafe)
  const protectedCheck = checkProtectedPackage(packageName, liveContext);
  if (protectedCheck.isProtected) {
    if (protectedCheck.reason) reasons.push(protectedCheck.reason);
    sources.push('hard-protected-policy');
    return {
      packageName,
      label,
      category: 'Unsafe',
      reasons,
      sources,
      blockedBy: protectedCheck.blockedBy,
      confidence: 'high',
      recommendedAction: 'keep-installed',
      dependencies: [],
      neededBy: [],
      isSystem,
      enabled,
      apkSizeBytes,
    };
  }

  // 2. Check merged community debloat lists
  const listEntry = lookupPackageInLists(packageName);
  const oemEval = evaluateOemRules(packageName, deviceManufacturer, Boolean(listEntry));

  if (oemEval.forcedCategory === 'Unsafe') {
    reasons.push(oemEval.cautionNote || 'Protected by OEM safety profile.');
    sources.push('oem-safety-profile');
    return {
      packageName,
      label,
      category: 'Unsafe',
      reasons,
      sources,
      blockedBy: `oem-profile:${oemEval.matchedOemProfile || 'oem'}`,
      confidence: 'high',
      recommendedAction: 'keep-installed',
      dependencies: listEntry?.dependencies || [],
      neededBy: listEntry?.neededBy || [],
      isSystem,
      enabled,
      apkSizeBytes,
    };
  }

  // 3. Unknown packages (not in any list) MUST default to Risky, NEVER Safe (Section 5.1)
  if (!listEntry) {
    if (oemEval.unlistedOemNamespaceWarning) {
      reasons.push(oemEval.unlistedOemNamespaceWarning);
      sources.push('oem-namespace-heuristic');
    } else {
      reasons.push(
        'Package is not present in any verified debloat list (UAD-NG, AppManager, Canta). Unknown packages always default to Risky.'
      );
      sources.push('unknown-package-default-policy');
    }
    if (oemEval.cautionNote) {
      reasons.push(oemEval.cautionNote);
    }

    return {
      packageName,
      label,
      category: 'Risky',
      reasons,
      sources,
      confidence: 'low',
      recommendedAction: 'disable-user',
      dependencies: [],
      neededBy: [],
      isSystem,
      enabled,
      apkSizeBytes,
    };
  }

  // 4. Combine merged list category with OEM adjustments using most-conservative wins
  let finalCategory: SafetyCategory = listEntry.mergedCategory;
  for (const src of listEntry.sources) {
    sources.push(`${src.sourceId}:${src.upstreamRating}`);
  }
  if (listEntry.description) {
    reasons.push(listEntry.description);
  }
  if (listEntry.hasConflict && listEntry.conflictExplanation) {
    reasons.push(listEntry.conflictExplanation);
  }
  for (const w of listEntry.warnings) {
    reasons.push(w);
  }
  if (oemEval.cautionNote) {
    reasons.push(oemEval.cautionNote);
  }
  if (oemEval.forcedCategory) {
    finalCategory = pickMoreConservativeCategory(finalCategory, oemEval.forcedCategory);
  }

  if (finalCategory === 'Unsafe') {
    return {
      packageName,
      label,
      category: 'Unsafe',
      reasons,
      sources,
      blockedBy: 'upstream-list-unsafe',
      confidence: 'high',
      recommendedAction: 'keep-installed',
      dependencies: listEntry.dependencies,
      neededBy: listEntry.neededBy,
      isSystem,
      enabled,
      apkSizeBytes,
    };
  }

  const confidence: PackageSafetyVerdict['confidence'] =
    listEntry.sources.length >= 2 && !listEntry.hasConflict
      ? 'high'
      : listEntry.sources.length >= 1
        ? 'medium'
        : 'low';

  const recommendedAction: PackageSafetyVerdict['recommendedAction'] =
    finalCategory === 'Safe'
      ? 'uninstall-keep-data'
      : finalCategory === 'Probably Safe'
        ? 'disable-user'
        : 'disable-user';

  return {
    packageName,
    label,
    category: finalCategory,
    reasons,
    sources,
    confidence,
    recommendedAction,
    dependencies: listEntry.dependencies,
    neededBy: listEntry.neededBy,
    isSystem,
    enabled,
    apkSizeBytes,
  };
}

export async function explainPackageClassification(
  packageName: string,
  serial?: string
): Promise<PackageSafetyVerdict> {
  const targetSerial = await adbClient.resolveTargetSerial(serial);
  const profile = await getDeviceProfile(targetSerial);
  let sharedUserId: string | undefined;
  let isSystem = true;
  let enabled = true;
  let apkSizeBytes: number | undefined;
  let label = inferHumanLabel(packageName);

  try {
    const details = await getAppDetails(packageName, targetSerial);
    sharedUserId = details.sharedUserId;
    isSystem = details.isSystem;
    enabled = details.enabled;
    apkSizeBytes = details.apkSizeBytes;
    label = details.label;
  } catch {
    // Package may not be installed on current device; still classify accurately
  }

  const liveContext = await gatherLiveProtectionContext(targetSerial, sharedUserId);
  return computeSafetyVerdict({
    packageName,
    label,
    isSystem,
    enabled,
    apkSizeBytes,
    deviceManufacturer: profile.manufacturer,
    liveContext,
  });
}

export async function classifyInstalledApps(options?: {
  serial?: string;
  categoryFilter?: SafetyCategory | 'all';
}): Promise<{
  serial: string;
  manufacturer: string;
  oemSkin: string;
  counts: Record<SafetyCategory, number>;
  verdicts: PackageSafetyVerdict[];
}> {
  const targetSerial = await adbClient.resolveTargetSerial(options?.serial);
  const [profile, inventory, baseLiveContext] = await Promise.all([
    getDeviceProfile(targetSerial),
    listInstalledApps({ serial: targetSerial }),
    gatherLiveProtectionContext(targetSerial),
  ]);

  const verdicts: PackageSafetyVerdict[] = [];
  const counts: Record<SafetyCategory, number> = {
    Safe: 0,
    'Probably Safe': 0,
    Risky: 0,
    Unsafe: 0,
  };

  for (const app of inventory.apps) {
    let sharedUserId: string | undefined;
    let apkSizeBytes: number | undefined;
    try {
      const details = await getAppDetails(app.packageName, targetSerial);
      sharedUserId = details.sharedUserId;
      apkSizeBytes = details.apkSizeBytes;
    } catch {
      sharedUserId = undefined;
    }

    const verdict = computeSafetyVerdict({
      packageName: app.packageName,
      label: app.label,
      isSystem: app.isSystem,
      enabled: app.enabled,
      apkSizeBytes,
      deviceManufacturer: profile.manufacturer,
      liveContext: {
        ...baseLiveContext,
        sharedUserId,
      },
    });

    counts[verdict.category]++;
    if (!options?.categoryFilter || options.categoryFilter === 'all' || verdict.category === options.categoryFilter) {
      verdicts.push(verdict);
    }
  }

  return {
    serial: targetSerial,
    manufacturer: profile.manufacturer,
    oemSkin: profile.oemSkin.displayName,
    counts,
    verdicts,
  };
}
