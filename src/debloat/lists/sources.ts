export interface DebloatSourceDefinition {
  id: 'uad-ng' | 'appmanager' | 'canta';
  name: string;
  repositoryUrl: string;
  pinnedCommitSha: string;
  licenseSpdx: string;
  attribution: string;
  rawUrls: string[];
}

export const DEBLOAT_LIST_SOURCES: Record<DebloatSourceDefinition['id'], DebloatSourceDefinition> = {
  'uad-ng': {
    id: 'uad-ng',
    name: 'Universal Android Debloater Next Generation (UAD-NG)',
    repositoryUrl: 'https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation',
    pinnedCommitSha: 'e1fff1efa87c54611b52771a31a03f408712deec',
    licenseSpdx: 'GPL-3.0',
    attribution: 'Universal Debloater Alliance & W1nst0n (Universal Android Debloater)',
    rawUrls: [
      'https://raw.githubusercontent.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/e1fff1efa87c54611b52771a31a03f408712deec/resources/assets/uad_lists.json',
    ],
  },
  appmanager: {
    id: 'appmanager',
    name: 'Muntashir Akon Android Debloat List (AppManager)',
    repositoryUrl: 'https://github.com/MuntashirAkon/android-debloat-list',
    pinnedCommitSha: '10c82498154523d29ba0f268e4ab8316ab19c16b',
    licenseSpdx: 'AGPL-3.0',
    attribution: 'Muntashir Al-Islam (MuntashirAkon) & AppManager Contributors',
    rawUrls: [
      'https://raw.githubusercontent.com/MuntashirAkon/android-debloat-list/10c82498154523d29ba0f268e4ab8316ab19c16b/aosp.json',
      'https://raw.githubusercontent.com/MuntashirAkon/android-debloat-list/10c82498154523d29ba0f268e4ab8316ab19c16b/carrier.json',
      'https://raw.githubusercontent.com/MuntashirAkon/android-debloat-list/10c82498154523d29ba0f268e4ab8316ab19c16b/google.json',
      'https://raw.githubusercontent.com/MuntashirAkon/android-debloat-list/10c82498154523d29ba0f268e4ab8316ab19c16b/misc.json',
      'https://raw.githubusercontent.com/MuntashirAkon/android-debloat-list/10c82498154523d29ba0f268e4ab8316ab19c16b/oem.json',
    ],
  },
  canta: {
    id: 'canta',
    name: 'Canta Debloat Repository Adapter (samolego/Canta)',
    repositoryUrl: 'https://github.com/samolego/Canta',
    pinnedCommitSha: 'e3ed0c9bf90ee6f8bfb7a92ba1e140327cda480f',
    licenseSpdx: 'LGPL-3.0',
    attribution: 'Samo Hribar (samolego) & Universal Debloater Alliance',
    rawUrls: [
      'https://raw.githubusercontent.com/samolego/Canta/e3ed0c9bf90ee6f8bfb7a92ba1e140327cda480f/composeApp/src/commonMain/kotlin/io/github/samolego/canta/data/bloat/BloatRepository.kt',
    ],
  },
};
