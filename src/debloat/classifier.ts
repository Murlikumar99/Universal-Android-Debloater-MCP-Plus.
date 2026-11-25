import fs from 'node:fs';
import path from 'node:path';
import { SafetyCategory } from './lists/normalize';

export interface OemProfileRule {
  id: string;
  name: string;
  manufacturers: string[];
  skinProperties: string[];
  namespaces: string[];
  alwaysUnsafe: string[];
  cautionPackages: Record<string, string>;
  safeBloatExamples: string[];
  notes: string;
}

interface OemProfilesFile {
  version: string;
  profiles: OemProfileRule[];
}

let cachedProfiles: OemProfileRule[] | null = null;

export function loadOemProfiles(): OemProfileRule[] {
  if (cachedProfiles) return cachedProfiles;
  const filePath = path.resolve(process.cwd(), 'data', 'oem-profiles.json');
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as OemProfilesFile;
  cachedProfiles = parsed.profiles;
  return cachedProfiles;
}

export interface OemClassificationAdjustment {
  matchedOemProfile?: string;
  forcedCategory?: SafetyCategory;
  cautionNote?: string;
  unlistedOemNamespaceWarning?: string;
}

export function evaluateOemRules(
  packageName: string,
  deviceManufacturer?: string,
  isPresentInDebloatLists = false
): OemClassificationAdjustment {
  const profiles = loadOemProfiles();
  const mfgLower = (deviceManufacturer || '').toLowerCase();

  for (const profile of profiles) {
    if (profile.alwaysUnsafe.includes(packageName)) {
      return {
        matchedOemProfile: profile.name,
        forcedCategory: 'Unsafe',
        cautionNote: `Protected by ${profile.name} profile: ${profile.notes}`,
      };
    }
    if (profile.cautionPackages[packageName]) {
      return {
        matchedOemProfile: profile.name,
        forcedCategory: 'Probably Safe',
        cautionNote: profile.cautionPackages[packageName],
      };
    }
  }

  const matchedProfile = profiles.find((p) => p.manufacturers.includes(mfgLower));
  const isOemNamespace = profiles.some((p) =>
    p.namespaces.some((ns) => packageName.startsWith(ns))
  );

  if (isOemNamespace && !isPresentInDebloatLists) {
    return {
      matchedOemProfile: matchedProfile?.name || 'OEM Namespace',
      forcedCategory: 'Risky',
      unlistedOemNamespaceWarning:
        'Unlisted system package in an OEM vendor namespace. Defaults to Risky because vendor services often have undocumented interdependencies.',
    };
  }

  return {
    matchedOemProfile: matchedProfile?.name,
  };
}
