export type SafetyCategory = 'Safe' | 'Probably Safe' | 'Risky' | 'Unsafe';

export interface NormalizedSourceEntry {
  packageName: string;
  sourceId: 'uad-ng' | 'appmanager' | 'canta';
  upstreamRating: string;
  mappedCategory: SafetyCategory;
  description: string;
  oemTags: string[];
  dependencies: string[];
  neededBy: string[];
  warning?: string;
  licenseSpdx: string;
}

/**
 * Maps UAD-NG removal tiers ("Recommended", "Advanced", "Expert", "Unsafe", "Unlisted")
 * to the canonical 4-tier SafetyCategory.
 */
export function mapUadRemovalToCategory(removal: string): SafetyCategory {
  switch (removal) {
    case 'Recommended':
      return 'Safe';
    case 'Advanced':
      return 'Probably Safe';
    case 'Expert':
      return 'Risky';
    case 'Unsafe':
      return 'Unsafe';
    default:
      return 'Risky';
  }
}

/**
 * Maps MuntashirAkon/android-debloat-list removal tiers ("delete", "replace", "caution", "unsafe")
 * to the canonical 4-tier SafetyCategory.
 */
export function mapAppManagerRemovalToCategory(removal: string): SafetyCategory {
  switch (removal) {
    case 'delete':
      return 'Safe';
    case 'replace':
      return 'Probably Safe';
    case 'caution':
      return 'Risky';
    case 'unsafe':
      return 'Unsafe';
    default:
      return 'Risky';
  }
}

export const CATEGORY_CONSERVATISM_RANK: Record<SafetyCategory, number> = {
  Safe: 1,
  'Probably Safe': 2,
  Risky: 3,
  Unsafe: 4,
};

export function pickMoreConservativeCategory(a: SafetyCategory, b: SafetyCategory): SafetyCategory {
  return CATEGORY_CONSERVATISM_RANK[a] >= CATEGORY_CONSERVATISM_RANK[b] ? a : b;
}
