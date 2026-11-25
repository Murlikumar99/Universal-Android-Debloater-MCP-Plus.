import fs from 'node:fs';
import path from 'node:path';
import { getSubDir } from '../../util/paths';
import { DEBLOAT_LIST_SOURCES } from './sources';
import { NormalizedSourceEntry } from './normalize';
import { mergeNormalizedLists, MergedPackageListEntry } from './merge';
import { fetchUadList } from './uadSync';
import { fetchAppManagerLists } from './appManagerSync';
import { fetchCantaMetadataAndProject } from './cantaSync';
import { logger } from '../../util/logger';

export interface ListCacheMetadata {
  lastSyncedAt: string | null;
  mode: 'live-synced' | 'cached-offline' | 'seed-fallback';
  sources: Array<{
    id: 'uad-ng' | 'appmanager' | 'canta';
    name: string;
    pinnedCommitSha: string;
    licenseSpdx: string;
    entryCount: number;
    rejectedCount: number;
    fetchedFromNetwork: boolean;
  }>;
  totalMergedPackages: number;
  conflictsResolvedCount: number;
}

interface StoredCacheFile {
  metadata: ListCacheMetadata;
  entries: MergedPackageListEntry[];
}

/**
 * Curated minimal baseline entries used strictly as an offline fallback before a live sync
 * or when running in an air-gapped environment.
 */
const OFFLINE_BASELINE_ENTRIES: NormalizedSourceEntry[] = [
  {
    packageName: 'com.samsung.android.game.gamehome',
    sourceId: 'uad-ng',
    upstreamRating: 'Recommended',
    mappedCategory: 'Safe',
    description: 'Samsung Gaming Hub (Game Launcher) promotional portal and game aggregator.',
    oemTags: ['Samsung', 'Oem'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.samsung.android.app.spage',
    sourceId: 'uad-ng',
    upstreamRating: 'Recommended',
    mappedCategory: 'Safe',
    description: 'Samsung Free / Samsung Daily news and content feed on home screen swipe.',
    oemTags: ['Samsung', 'Oem'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.samsung.android.aremoji',
    sourceId: 'uad-ng',
    upstreamRating: 'Recommended',
    mappedCategory: 'Safe',
    description: 'Samsung 3D AR Emoji avatar creator for camera.',
    oemTags: ['Samsung', 'Oem'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.facebook.services',
    sourceId: 'uad-ng',
    upstreamRating: 'Recommended',
    mappedCategory: 'Safe',
    description: 'Pre-installed Meta/Facebook background service daemon.',
    oemTags: ['ThirdParty', 'Meta'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.facebook.appmanager',
    sourceId: 'appmanager',
    upstreamRating: 'delete',
    mappedCategory: 'Safe',
    description: 'Pre-installed Facebook App Manager background updater.',
    oemTags: ['misc', 'Meta'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'AGPL-3.0',
  },
  {
    packageName: 'com.samsung.android.scloud',
    sourceId: 'uad-ng',
    upstreamRating: 'Advanced',
    mappedCategory: 'Probably Safe',
    description: 'Samsung Cloud sync and backup service. Safe to remove if you do not use Samsung Cloud.',
    oemTags: ['Samsung', 'Oem'],
    dependencies: ['com.osp.app.signin'],
    neededBy: ['com.samsung.android.smartswitchassistant'],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.samsung.android.scloud',
    sourceId: 'appmanager',
    upstreamRating: 'caution',
    mappedCategory: 'Risky',
    description: 'Samsung Cloud service; removing breaks Samsung Cloud backup and Smart Switch.',
    oemTags: ['oem', 'Samsung'],
    dependencies: ['com.osp.app.signin'],
    neededBy: [],
    warning: 'Breaks Samsung Cloud backup and Smart Switch restore.',
    licenseSpdx: 'AGPL-3.0',
  },
  {
    packageName: 'com.samsung.android.themestore',
    sourceId: 'uad-ng',
    upstreamRating: 'Advanced',
    mappedCategory: 'Probably Safe',
    description: 'Galaxy Themes store. Removing disables custom themes and reverts to default One UI theme.',
    oemTags: ['Samsung', 'Oem'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.microsoft.appmanager',
    sourceId: 'uad-ng',
    upstreamRating: 'Advanced',
    mappedCategory: 'Probably Safe',
    description: 'Microsoft Link to Windows (Phone Link) companion integration.',
    oemTags: ['Samsung', 'Microsoft'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.miui.msa.global',
    sourceId: 'uad-ng',
    upstreamRating: 'Recommended',
    mappedCategory: 'Safe',
    description: 'MIUI System Ads (MSA) service delivering advertisements in Xiaomi system apps.',
    oemTags: ['Xiaomi', 'MIUI'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
  {
    packageName: 'com.miui.analytics',
    sourceId: 'appmanager',
    upstreamRating: 'delete',
    mappedCategory: 'Safe',
    description: 'Xiaomi MIUI telemetry and analytics collection service.',
    oemTags: ['oem', 'Xiaomi'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'AGPL-3.0',
  },
  {
    packageName: 'com.xiaomi.mipicks',
    sourceId: 'uad-ng',
    upstreamRating: 'Recommended',
    mappedCategory: 'Safe',
    description: 'Xiaomi GetApps store pre-installed on global MIUI/HyperOS devices.',
    oemTags: ['Xiaomi', 'Oem'],
    dependencies: [],
    neededBy: [],
    licenseSpdx: 'GPL-3.0',
  },
];

let inMemoryMap: Map<string, MergedPackageListEntry> | null = null;
let inMemoryMeta: ListCacheMetadata | null = null;

function getCacheFilePath(): string {
  return path.join(getSubDir('lists'), 'merged-debloat-cache.json');
}

export function loadMergedDebloatCache(): {
  metadata: ListCacheMetadata;
  packages: Map<string, MergedPackageListEntry>;
} {
  if (inMemoryMap && inMemoryMeta) {
    return { metadata: inMemoryMeta, packages: inMemoryMap };
  }

  const filePath = getCacheFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as StoredCacheFile;
      if (raw && raw.metadata && Array.isArray(raw.entries)) {
        inMemoryMap = new Map(raw.entries.map((e) => [e.packageName, e]));
        inMemoryMeta = raw.metadata;
        return { metadata: inMemoryMeta, packages: inMemoryMap };
      }
    } catch (err) {
      logger.warn({ err }, 'Corrupt debloat list cache detected; falling back to baseline');
    }
  }

  const merged = mergeNormalizedLists(OFFLINE_BASELINE_ENTRIES);
  const conflicts = Array.from(merged.values()).filter((m) => m.hasConflict).length;

  const meta: ListCacheMetadata = {
    lastSyncedAt: null,
    mode: 'seed-fallback',
    sources: [
      {
        id: 'uad-ng',
        name: DEBLOAT_LIST_SOURCES['uad-ng'].name,
        pinnedCommitSha: DEBLOAT_LIST_SOURCES['uad-ng'].pinnedCommitSha,
        licenseSpdx: DEBLOAT_LIST_SOURCES['uad-ng'].licenseSpdx,
        entryCount: OFFLINE_BASELINE_ENTRIES.filter((e) => e.sourceId === 'uad-ng').length,
        rejectedCount: 0,
        fetchedFromNetwork: false,
      },
      {
        id: 'appmanager',
        name: DEBLOAT_LIST_SOURCES.appmanager.name,
        pinnedCommitSha: DEBLOAT_LIST_SOURCES.appmanager.pinnedCommitSha,
        licenseSpdx: DEBLOAT_LIST_SOURCES.appmanager.licenseSpdx,
        entryCount: OFFLINE_BASELINE_ENTRIES.filter((e) => e.sourceId === 'appmanager').length,
        rejectedCount: 0,
        fetchedFromNetwork: false,
      },
      {
        id: 'canta',
        name: DEBLOAT_LIST_SOURCES.canta.name,
        pinnedCommitSha: DEBLOAT_LIST_SOURCES.canta.pinnedCommitSha,
        licenseSpdx: DEBLOAT_LIST_SOURCES.canta.licenseSpdx,
        entryCount: 0,
        rejectedCount: 0,
        fetchedFromNetwork: false,
      },
    ],
    totalMergedPackages: merged.size,
    conflictsResolvedCount: conflicts,
  };

  inMemoryMap = merged;
  inMemoryMeta = meta;
  return { metadata: meta, packages: merged };
}

export async function syncDebloatLists(options?: { offlineOnly?: boolean }): Promise<ListCacheMetadata> {
  if (options?.offlineOnly) {
    const { metadata } = loadMergedDebloatCache();
    return metadata;
  }

  try {
    const [uadRes, appMgrRes] = await Promise.all([fetchUadList(), fetchAppManagerLists()]);
    const cantaRes = await fetchCantaMetadataAndProject(uadRes.entries.slice(0, 500));

    const combined = [
      ...OFFLINE_BASELINE_ENTRIES,
      ...uadRes.entries,
      ...appMgrRes.entries,
      ...cantaRes.entries,
    ];
    const merged = mergeNormalizedLists(combined);
    const conflicts = Array.from(merged.values()).filter((m) => m.hasConflict).length;

    const meta: ListCacheMetadata = {
      lastSyncedAt: new Date().toISOString(),
      mode: 'live-synced',
      sources: [
        {
          id: 'uad-ng',
          name: DEBLOAT_LIST_SOURCES['uad-ng'].name,
          pinnedCommitSha: uadRes.pinnedCommitSha,
          licenseSpdx: DEBLOAT_LIST_SOURCES['uad-ng'].licenseSpdx,
          entryCount: uadRes.entries.length,
          rejectedCount: uadRes.rejectedCount,
          fetchedFromNetwork: true,
        },
        {
          id: 'appmanager',
          name: DEBLOAT_LIST_SOURCES.appmanager.name,
          pinnedCommitSha: appMgrRes.pinnedCommitSha,
          licenseSpdx: DEBLOAT_LIST_SOURCES.appmanager.licenseSpdx,
          entryCount: appMgrRes.entries.length,
          rejectedCount: appMgrRes.rejectedCount,
          fetchedFromNetwork: true,
        },
        {
          id: 'canta',
          name: DEBLOAT_LIST_SOURCES.canta.name,
          pinnedCommitSha: cantaRes.pinnedCommitSha,
          licenseSpdx: DEBLOAT_LIST_SOURCES.canta.licenseSpdx,
          entryCount: cantaRes.entries.length,
          rejectedCount: 0,
          fetchedFromNetwork: true,
        },
      ],
      totalMergedPackages: merged.size,
      conflictsResolvedCount: conflicts,
    };

    const filePath = getCacheFilePath();
    const payload: StoredCacheFile = {
      metadata: meta,
      entries: Array.from(merged.values()),
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    inMemoryMap = merged;
    inMemoryMeta = meta;
    return meta;
  } catch (err) {
    logger.warn({ err }, 'Network sync failed; retaining cached/offline debloat list');
    const current = loadMergedDebloatCache();
    return {
      ...current.metadata,
      mode: current.metadata.lastSyncedAt ? 'cached-offline' : 'seed-fallback',
    };
  }
}

export function lookupPackageInLists(packageName: string): MergedPackageListEntry | null {
  const { packages } = loadMergedDebloatCache();
  return packages.get(packageName) || null;
}
