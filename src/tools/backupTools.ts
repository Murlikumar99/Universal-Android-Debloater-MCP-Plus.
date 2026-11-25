import { z } from 'zod';
import { McpToolDefinition } from './types';
import { createPackageBackups, listBackupSessions } from '../debloat/backup';
import { verifyAuditLogIntegrity } from '../audit/auditLog';
import { generateBeforeAfterReport } from '../debloat/report';

export const backupTools: McpToolDefinition[] = [
  {
    name: 'list_backups',
    description: 'Lists local APK and metadata backup sessions with SHA-256 file checksums.',
    category: 'read-only',
    annotations: {
      title: 'List Local Backup Sessions',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        serial: { type: 'string' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ serial: z.string().optional() }).parse(raw);
      const backups = listBackupSessions(parsed.serial);
      return {
        summary: `Found ${backups.length} backup session(s).`,
        data: backups,
      };
    },
  },
  {
    name: 'verify_audit_log',
    description: 'Verifies the cryptographic SHA-256 hash chain of the append-only JSONL audit log to detect any tampering.',
    category: 'read-only',
    annotations: {
      title: 'Verify Audit Log Hash Chain',
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
      const data = verifyAuditLogIntegrity();
      return {
        summary: data.valid
          ? `Audit log integrity verified: ${data.totalEntries} entries intact (head SHA-256: ${data.headHash.slice(0, 16)}...).`
          : `ALERT: Audit log tampering detected at index ${data.tamperedAtIndex}: ${data.errorReason}`,
        data,
      };
    },
  },
  {
    name: 'generate_report',
    description: 'Generates a multi-sample before/after resource and package telemetry report in Markdown and JSON.',
    category: 'read-only',
    annotations: {
      title: 'Generate Performance & Telemetry Report',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
      sampleCount: z.number().int().min(1).max(5).optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        serial: { type: 'string' },
        sampleCount: { type: 'number' },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          serial: z.string().optional(),
          sampleCount: z.number().int().min(1).max(5).optional(),
        })
        .parse(raw);
      const data = await generateBeforeAfterReport(parsed);
      return {
        summary: `Generated report ${data.reportId} (${data.sampleCount} samples): Available RAM avg ${data.after.availableRamMbAvg} MB, Free /data ${data.after.dataFreeGb} GB.`,
        data,
      };
    },
  },
  {
    name: 'create_backup',
    description: 'Pulls package APKs and dumpsys metadata to the local host backup directory and verifies SHA-256 checksums without modifying the device.',
    category: 'planning',
    annotations: {
      title: 'Create Verified Package Backup',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
      packages: z.array(
        z.object({
          packageName: z.string(),
          action: z.enum(['uninstall-keep-data', 'disable-user']).optional(),
        })
      ),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['packages'],
      properties: {
        serial: { type: 'string' },
        packages: {
          type: 'array',
          items: {
            type: 'object',
            required: ['packageName'],
            properties: {
              packageName: { type: 'string' },
              action: { type: 'string', enum: ['uninstall-keep-data', 'disable-user'] },
            },
          },
        },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          serial: z.string().optional(),
          packages: z.array(
            z.object({
              packageName: z.string(),
              action: z.enum(['uninstall-keep-data', 'disable-user']).optional(),
            })
          ),
        })
        .parse(raw);
      const data = await createPackageBackups(parsed);
      return {
        summary: `Created verified backup ${data.backupId} for ${data.packages.length} package(s) at ${data.backupDir}.`,
        data,
      };
    },
  },
];
