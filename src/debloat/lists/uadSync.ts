import { z } from 'zod';
import { DEBLOAT_LIST_SOURCES } from './sources';
import { mapUadRemovalToCategory, NormalizedSourceEntry } from './normalize';

const UadEntrySchema = z.object({
  list: z.string().default('Unknown'),
  description: z.string().default(''),
  dependencies: z.array(z.string()).default([]),
  neededBy: z.array(z.string()).default([]),
  labels: z.array(z.string()).default([]),
  removal: z.enum(['Recommended', 'Advanced', 'Expert', 'Unsafe', 'Unlisted']).catch('Expert'),
});

export function parseUadJsonPayload(rawJson: unknown): {
  entries: NormalizedSourceEntry[];
  rejectedCount: number;
} {
  if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    return { entries: [], rejectedCount: 1 };
  }

  const entries: NormalizedSourceEntry[] = [];
  let rejectedCount = 0;
  const sourceDef = DEBLOAT_LIST_SOURCES['uad-ng'];

  for (const [pkgName, val] of Object.entries(rawJson as Record<string, unknown>)) {
    const parsed = UadEntrySchema.safeParse(val);
    if (!parsed.success) {
      rejectedCount++;
      continue;
    }
    const item = parsed.data;
    entries.push({
      packageName: pkgName.trim(),
      sourceId: 'uad-ng',
      upstreamRating: item.removal,
      mappedCategory: mapUadRemovalToCategory(item.removal),
      description: item.description.trim(),
      oemTags: [item.list, ...item.labels].filter(Boolean),
      dependencies: item.dependencies,
      neededBy: item.neededBy,
      licenseSpdx: sourceDef.licenseSpdx,
    });
  }

  return { entries, rejectedCount };
}

export async function fetchUadList(): Promise<{
  entries: NormalizedSourceEntry[];
  rejectedCount: number;
  pinnedCommitSha: string;
}> {
  const sourceDef = DEBLOAT_LIST_SOURCES['uad-ng'];
  const url = sourceDef.rawUrls[0]!;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`UAD-NG HTTP ${response.status} when fetching ${url}`);
  }
  const json = await response.json();
  const { entries, rejectedCount } = parseUadJsonPayload(json);
  return {
    entries,
    rejectedCount,
    pinnedCommitSha: sourceDef.pinnedCommitSha,
  };
}
