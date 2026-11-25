import { z } from 'zod';
import { DEBLOAT_LIST_SOURCES } from './sources';
import { mapAppManagerRemovalToCategory, NormalizedSourceEntry } from './normalize';

const AppManagerItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().default(''),
  description: z.string().default(''),
  removal: z.enum(['delete', 'replace', 'caution', 'unsafe']),
  dependencies: z.array(z.string()).optional(),
  required_by: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  warning: z.string().optional(),
});

export function parseAppManagerArrayPayload(
  rawJson: unknown,
  categoryTag = 'AppManager'
): { entries: NormalizedSourceEntry[]; rejectedCount: number } {
  if (!Array.isArray(rawJson)) {
    return { entries: [], rejectedCount: 1 };
  }

  const entries: NormalizedSourceEntry[] = [];
  let rejectedCount = 0;
  const sourceDef = DEBLOAT_LIST_SOURCES.appmanager;

  for (const item of rawJson) {
    const parsed = AppManagerItemSchema.safeParse(item);
    if (!parsed.success) {
      rejectedCount++;
      continue;
    }
    const d = parsed.data;
    entries.push({
      packageName: d.id.trim(),
      sourceId: 'appmanager',
      upstreamRating: d.removal,
      mappedCategory: mapAppManagerRemovalToCategory(d.removal),
      description: d.description.trim() || d.label,
      oemTags: [categoryTag, ...(d.tags || [])].filter(Boolean),
      dependencies: d.dependencies || [],
      neededBy: d.required_by || [],
      warning: d.warning,
      licenseSpdx: sourceDef.licenseSpdx,
    });
  }

  return { entries, rejectedCount };
}

export async function fetchAppManagerLists(): Promise<{
  entries: NormalizedSourceEntry[];
  rejectedCount: number;
  pinnedCommitSha: string;
}> {
  const sourceDef = DEBLOAT_LIST_SOURCES.appmanager;
  const allEntries: NormalizedSourceEntry[] = [];
  let totalRejected = 0;

  await Promise.all(
    sourceDef.rawUrls.map(async (url) => {
      const fileName = url.split('/').pop()?.replace('.json', '') || 'general';
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        throw new Error(`AppManager HTTP ${response.status} when fetching ${url}`);
      }
      const json = await response.json();
      const { entries, rejectedCount } = parseAppManagerArrayPayload(json, fileName);
      allEntries.push(...entries);
      totalRejected += rejectedCount;
    })
  );

  return {
    entries: allEntries,
    rejectedCount: totalRejected,
    pinnedCommitSha: sourceDef.pinnedCommitSha,
  };
}
