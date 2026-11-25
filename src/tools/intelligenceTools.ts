import { z } from 'zod';
import { McpToolDefinition } from './types';
import { syncDebloatLists, loadMergedDebloatCache, lookupPackageInLists } from '../debloat/lists/cache';
import { classifyInstalledApps, explainPackageClassification } from '../debloat/safetyEngine';

export const intelligenceTools: McpToolDefinition[] = [
  {
    name: 'sync_debloat_lists',
    description: 'Synchronizes debloat lists from official pinned commit SHAs (UAD Next Generation, MuntashirAkon AppManager, and Canta) with local cache and conflict resolution.',
    category: 'read-only',
    annotations: {
      title: 'Sync Upstream Debloat Lists',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    zodSchema: z.object({
      offlineOnly: z.boolean().optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        offlineOnly: { type: 'boolean' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ offlineOnly: z.boolean().optional() }).parse(raw);
      const data = await syncDebloatLists(parsed);
      return {
        summary: `List sync mode=${data.mode}: ${data.totalMergedPackages} merged packages (${data.conflictsResolvedCount} source conflicts resolved conservatively).`,
        data,
      };
    },
  },
  {
    name: 'get_list_status',
    description: 'Returns local cache status, pinned commit SHAs, SPDX licenses, and package counts for UAD-NG, AppManager, and Canta lists.',
    category: 'read-only',
    annotations: {
      title: 'Get Debloat List Cache Status',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({}),
    inputSchemaJson: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const { metadata } = loadMergedDebloatCache();
      return {
        summary: `Mode: ${metadata.mode}, Total merged packages: ${metadata.totalMergedPackages}, Last synced: ${metadata.lastSyncedAt || 'offline baseline'}.`,
        data: metadata,
      };
    },
  },
  {
    name: 'lookup_package',
    description: 'Looks up a package name in the merged UAD-NG, AppManager, and Canta database, showing per-source ratings and conflict resolution.',
    category: 'read-only',
    annotations: {
      title: 'Lookup Package in Debloat Lists',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      packageName: z.string().min(1),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['packageName'],
      properties: {
        packageName: { type: 'string' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ packageName: z.string().min(1) }).parse(raw);
      const entry = lookupPackageInLists(parsed.packageName);
      return {
        summary: entry
          ? `${entry.packageName}: Merged Category = ${entry.mergedCategory} (sources: ${entry.sources.map((s: { sourceId: string; upstreamRating: string }) => `${s.sourceId}:${s.upstreamRating}`).join(', ')}).`
          : `Package "${parsed.packageName}" is unlisted in UAD-NG, AppManager, and Canta (defaults to Risky).`,
        data: entry || { packageName: parsed.packageName, found: false, defaultCategory: 'Risky' },
      };
    },
  },
  {
    name: 'classify_apps',
    description: 'Runs the manufacturer-aware Safety Engine across installed apps on the target device, classifying each into Safe, Probably Safe, Risky, or Unsafe.',
    category: 'read-only',
    annotations: {
      title: 'Classify Installed Apps with Safety Engine',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
      categoryFilter: z.enum(['all', 'Safe', 'Probably Safe', 'Risky', 'Unsafe']).optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        serial: { type: 'string' },
        categoryFilter: { type: 'string', enum: ['all', 'Safe', 'Probably Safe', 'Risky', 'Unsafe'] },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          serial: z.string().optional(),
          categoryFilter: z.enum(['all', 'Safe', 'Probably Safe', 'Risky', 'Unsafe']).optional(),
        })
        .parse(raw);
      const data = await classifyInstalledApps(parsed);
      return {
        summary: `Classified packages on ${data.serial} (${data.oemSkin}): Safe=${data.counts.Safe}, Probably Safe=${data.counts['Probably Safe']}, Risky=${data.counts.Risky}, Unsafe=${data.counts.Unsafe}.`,
        data,
      };
    },
  },
  {
    name: 'explain_classification',
    description: 'Provides a full human-readable safety verdict explanation for a single package, including protected-package rules, OEM rules, live role checks, and list sources.',
    category: 'read-only',
    annotations: {
      title: 'Explain Package Safety Verdict',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      packageName: z.string().min(1),
      serial: z.string().optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['packageName'],
      properties: {
        packageName: { type: 'string' },
        serial: { type: 'string' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ packageName: z.string().min(1), serial: z.string().optional() }).parse(raw);
      const data = await explainPackageClassification(parsed.packageName, parsed.serial);
      return {
        summary: `${data.packageName} -> ${data.category} (recommended: ${data.recommendedAction}). ${data.reasons.join(' ')}`,
        data,
      };
    },
  },
];
