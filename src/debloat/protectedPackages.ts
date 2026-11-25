import fs from 'node:fs';
import path from 'node:path';

export interface ProtectedPackagesRuleset {
  version: string;
  description: string;
  exactPackages: string[];
  prefixPatterns: string[];
  regexPatterns: string[];
  protectedSharedUserIds: string[];
  protectedCoreRoles: string[];
}

let cachedRuleset: ProtectedPackagesRuleset | null = null;
let compiledRegexes: RegExp[] | null = null;
let exactSet: Set<string> | null = null;
let sharedUidSet: Set<string> | null = null;

export function loadProtectedRuleset(): ProtectedPackagesRuleset {
  if (cachedRuleset) return cachedRuleset;
  const filePath = path.resolve(process.cwd(), 'data', 'protected-packages.json');
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as ProtectedPackagesRuleset;
  cachedRuleset = raw;
  exactSet = new Set(raw.exactPackages);
  sharedUidSet = new Set(raw.protectedSharedUserIds);
  compiledRegexes = raw.regexPatterns.map((r) => new RegExp(r));
  return raw;
}

export interface LiveDeviceProtectionContext {
  roleHolders?: Record<string, string[]>;
  activeInputMethods?: string[];
  enabledAccessibilityPackages?: string[];
  sharedUserId?: string;
}

export interface ProtectedCheckResult {
  isProtected: boolean;
  blockedBy?: string;
  reason?: string;
}

export function checkProtectedPackage(
  packageName: string,
  liveContext?: LiveDeviceProtectionContext
): ProtectedCheckResult {
  const rules = loadProtectedRuleset();

  if (exactSet?.has(packageName)) {
    return {
      isProtected: true,
      blockedBy: `protected-exact:${packageName}`,
      reason: `Hard-protected core system/OEM package ("${packageName}"). Removing or disabling this component can brick the OS, break boot/telephony/accounts, or require a factory reset.`,
    };
  }

  for (const prefix of rules.prefixPatterns) {
    if (packageName.startsWith(prefix)) {
      return {
        isProtected: true,
        blockedBy: `protected-prefix:${prefix}`,
        reason: `Matches protected Android namespace prefix "${prefix}" (essential connectivity, provider, or security subsystem).`,
      };
    }
  }

  if (compiledRegexes) {
    for (const rx of compiledRegexes) {
      if (rx.test(packageName)) {
        return {
          isProtected: true,
          blockedBy: `protected-regex:${rx.source}`,
          reason: `Matches protected critical component pattern (${rx.source}).`,
        };
      }
    }
  }

  if (liveContext?.sharedUserId && sharedUidSet?.has(liveContext.sharedUserId)) {
    return {
      isProtected: true,
      blockedBy: `protected-shared-uid:${liveContext.sharedUserId}`,
      reason: `Shares privileged Linux UID (${liveContext.sharedUserId}) with core Android framework components.`,
    };
  }

  if (liveContext?.roleHolders) {
    for (const [role, holders] of Object.entries(liveContext.roleHolders)) {
      if (holders.includes(packageName)) {
        return {
          isProtected: true,
          blockedBy: `active-role-holder:${role}`,
          reason: `Currently assigned as the default handler for core system role "${role}".`,
        };
      }
    }
  }

  if (liveContext?.activeInputMethods) {
    for (const ime of liveContext.activeInputMethods) {
      if (ime.startsWith(`${packageName}/`) || ime === packageName) {
        return {
          isProtected: true,
          blockedBy: `active-ime:${ime}`,
          reason: `Currently enabled Input Method Editor (keyboard). Removing it can lock you out of password entry.`,
        };
      }
    }
  }

  if (liveContext?.enabledAccessibilityPackages?.includes(packageName)) {
    return {
      isProtected: true,
      blockedBy: 'active-accessibility-service',
      reason: 'Provides an active user-enabled Accessibility Service.',
    };
  }

  return { isProtected: false };
}
