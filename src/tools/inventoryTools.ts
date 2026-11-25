import { z } from 'zod';
import { McpToolDefinition } from './types';
import { listInstalledApps } from '../apps/inventory';
import { getAppDetails } from '../apps/appInfo';
import { auditPermissions } from '../apps/permissions';

export const inventoryTools: McpToolDefinition[] = [
  {
    name: 'list_installed_apps',
    description: 'Lists installed packages for --user 0 with system/third-party/enabled/disabled filtering, search, pagination, and multi-user profile detection.',
    category: 'read-only',
    annotations: {
      title: 'List Installed Apps (User 0)',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
      filter: z.enum(['all', 'system', 'third-party', 'enabled', 'disabled']).optional(),
      search: z.string().optional(),
      limit: z.number().int().min(1).max(500).optional(),
      offset: z.number().int().min(0).optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        serial: { type: 'string' },
        filter: { type: 'string', enum: ['all', 'system', 'third-party', 'enabled', 'disabled'] },
        search: { type: 'string' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          serial: z.string().optional(),
          filter: z.enum(['all', 'system', 'third-party', 'enabled', 'disabled']).optional(),
          search: z.string().optional(),
          limit: z.number().int().min(1).max(500).optional(),
          offset: z.number().int().min(0).optional(),
        })
        .parse(raw);
      const data = await listInstalledApps(parsed);
      return {
        summary: `Returned ${data.apps.length} of ${data.totalPackages} total packages (${data.systemPackagesCount} system, ${data.disabledPackagesCount} disabled).`,
        data,
      };
    },
  },
  {
    name: 'get_app_details',
    description: 'Inspects a single package via dumpsys package, returning version, APK paths, sharedUserId, installer source, and requested/granted permissions.',
    category: 'read-only',
    annotations: {
      title: 'Get Package Details',
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
      const data = await getAppDetails(parsed.packageName, parsed.serial);
      return {
        summary: `${data.label} (${data.packageName}) v${data.versionName} (${data.isSystem ? 'System' : 'User'}, ${data.enabled ? 'Enabled' : 'Disabled'}).`,
        data,
      };
    },
  },
  {
    name: 'audit_permissions',
    description: 'Audits sensitive permissions across installed apps, calculates risk scores (0-100), and flags system apps with unusual sensitive grants.',
    category: 'read-only',
    annotations: {
      title: 'Audit Sensitive App Permissions',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
      packageName: z.string().optional(),
      onlyGranted: z.boolean().optional(),
      minRiskScore: z.number().int().min(0).max(100).optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        serial: { type: 'string' },
        packageName: { type: 'string' },
        onlyGranted: { type: 'boolean' },
        minRiskScore: { type: 'number' },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          serial: z.string().optional(),
          packageName: z.string().optional(),
          onlyGranted: z.boolean().optional(),
          minRiskScore: z.number().int().min(0).max(100).optional(),
        })
        .parse(raw);
      const data = await auditPermissions(parsed);
      return {
        summary: `Audited ${data.auditedCount} package(s): ${data.highRiskCount} high/critical risk, ${data.flaggedSystemAppsCount} system app(s) flagged with unusual grants.`,
        data,
      };
    },
  },
];
