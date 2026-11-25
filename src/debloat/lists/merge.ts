import {
  NormalizedSourceEntry,
  pickMoreConservativeCategory,
  SafetyCategory,
} from './normalize';

export interface MergedPackageListEntry {
  packageName: string;
  mergedCategory: SafetyCategory;
  sources: Array<{
    sourceId: 'uad-ng' | 'appmanager' | 'canta';
    upstreamRating: string;
    mappedCategory: SafetyCategory;
    licenseSpdx: string;
  }>;
  hasConflict: boolean;
  conflictExplanation?: string;
  description: string;
  oemTags: string[];
  dependencies: string[];
  neededBy: string[];
  warnings: string[];
}

/**
 * Merges normalized entries from multiple sources.
 * Conflict resolution rule (Section 4):
 * "the most conservative rating wins when sources disagree. Record the disagreement for transparency."
 */
export function mergeNormalizedLists(
  allEntries: NormalizedSourceEntry[]
): Map<string, MergedPackageListEntry> {
  const byPackage = new Map<string, NormalizedSourceEntry[]>();

  for (const entry of allEntries) {
    if (!entry.packageName) continue;
    const list = byPackage.get(entry.packageName) || [];
    list.push(entry);
    byPackage.set(entry.packageName, list);
  }

  const mergedMap = new Map<string, MergedPackageListEntry>();

  for (const [packageName, items] of byPackage.entries()) {
    let conservativeCategory: SafetyCategory = items[0]!.mappedCategory;
    const distinctCategories = new Set<SafetyCategory>();
    const oemTags = new Set<string>();
    const dependencies = new Set<string>();
    const neededBy = new Set<string>();
    const warnings: string[] = [];
    let bestDescription = '';

    for (const item of items) {
      distinctCategories.add(item.mappedCategory);
      conservativeCategory = pickMoreConservativeCategory(conservativeCategory, item.mappedCategory);
      if (item.description.length > bestDescription.length) {
        bestDescription = item.description;
      }
      for (const tag of item.oemTags) oemTags.add(tag);
      for (const dep of item.dependencies) dependencies.add(dep);
      for (const nb of item.neededBy) neededBy.add(nb);
      if (item.warning) warnings.push(`[${item.sourceId}] ${item.warning}`);
    }

    const hasConflict = distinctCategories.size > 1;
    let conflictExplanation: string | undefined;
    if (hasConflict) {
      const breakdown = items
        .map((i) => `${i.sourceId}=${i.upstreamRating}(${i.mappedCategory})`)
        .join(', ');
      conflictExplanation = `Sources disagreed (${breakdown}); resolved to most conservative rating: ${conservativeCategory}.`;
    }

    mergedMap.set(packageName, {
      packageName,
      mergedCategory: conservativeCategory,
      sources: items.map((i) => ({
        sourceId: i.sourceId,
        upstreamRating: i.upstreamRating,
        mappedCategory: i.mappedCategory,
        licenseSpdx: i.licenseSpdx,
      })),
      hasConflict,
      conflictExplanation,
      description: bestDescription,
      oemTags: Array.from(oemTags),
      dependencies: Array.from(dependencies),
      neededBy: Array.from(neededBy),
      warnings,
    });
  }

  return mergedMap;
}
