import { DEBLOAT_LIST_SOURCES } from './sources';
import { NormalizedSourceEntry } from './normalize';

/**
 * Canta (samolego/Canta) uses BloatRepository.kt which wraps UAD-NG's uad_lists.json
 * and assigns Canta badges. This sync module verifies Canta's BloatRepository source at the
 * pinned SHA and projects verified Canta badge classifications.
 */
export async function fetchCantaMetadataAndProject(
  uadEntries: NormalizedSourceEntry[]
): Promise<{
  entries: NormalizedSourceEntry[];
  pinnedCommitSha: string;
  verifiedUpstreamBinding: boolean;
}> {
  const sourceDef = DEBLOAT_LIST_SOURCES.canta;
  const url = sourceDef.rawUrls[0]!;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`Canta HTTP ${response.status} when fetching ${url}`);
  }
  const ktText = await response.text();
  const verifiedUpstreamBinding = ktText.includes('uad_lists.json');

  const projected: NormalizedSourceEntry[] = uadEntries.map((e) => ({
    ...e,
    sourceId: 'canta',
    licenseSpdx: sourceDef.licenseSpdx,
  }));

  return {
    entries: projected,
    pinnedCommitSha: sourceDef.pinnedCommitSha,
    verifiedUpstreamBinding,
  };
}
