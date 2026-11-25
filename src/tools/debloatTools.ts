import { z } from 'zod';
import { McpToolDefinition } from './types';
import { createRemovalPlan } from '../debloat/planner';
import { createRestorePlan, executeRestorePlan, generateRestoreScripts } from '../debloat/restore';
import { executeApprovedPlan } from '../debloat/executor';

export const debloatTools: McpToolDefinition[] = [
  {
    name: 'plan_removal',
    description: 'Creates an immutable, SHA-256 hashed removal plan. Blocks Unsafe packages and outputs instructions for out-of-band human approval.',
    category: 'planning',
    annotations: {
      title: 'Create Immutable Removal Plan',
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
      acknowledgeRisky: z.boolean().optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['packages'],
      properties: {
        serial: { type: 'string' },
        acknowledgeRisky: { type: 'boolean' },
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
          acknowledgeRisky: z.boolean().optional(),
          packages: z.array(
            z.object({
              packageName: z.string(),
              action: z.enum(['uninstall-keep-data', 'disable-user']).optional(),
            })
          ),
        })
        .parse(raw);
      const fullPlan = await createRemovalPlan(parsed);

      // Section 6: Omit requiredConfirmationPhrase from returned payload to prevent AI self-approval
      const { requiredConfirmationPhrase, ...sanitizedPlan } = fullPlan;
      return {
        summary: `Created immutable plan ${fullPlan.planId} (SHA-256: ${fullPlan.planHash.slice(0, 12)}). Human operator must run "${fullPlan.cliApproveCommand}" in an interactive terminal to authorize.`,
        data: sanitizedPlan,
      };
    },
  },
  {
    name: 'plan_restore',
    description: 'Generates a restoration plan from a backup session, explicit package list, or the audit log.',
    category: 'planning',
    annotations: {
      title: 'Create Restoration Plan',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
      backupId: z.string().optional(),
      packages: z.array(z.string()).optional(),
      restoreAllFromAuditLog: z.boolean().optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        serial: { type: 'string' },
        backupId: { type: 'string' },
        packages: { type: 'array', items: { type: 'string' } },
        restoreAllFromAuditLog: { type: 'boolean' },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          serial: z.string().optional(),
          backupId: z.string().optional(),
          packages: z.array(z.string()).optional(),
          restoreAllFromAuditLog: z.boolean().optional(),
        })
        .parse(raw);
      const data = await createRestorePlan(parsed);
      return {
        summary: `Prepared restoration plan ${data.restorePlanId} with ${data.items.length} package(s).`,
        data,
      };
    },
  },
  {
    name: 'generate_restore_script',
    description: 'Generates cross-platform restoration scripts (.sh with LF and .ps1 with CRLF) targeting the specified device serial.',
    category: 'planning',
    annotations: {
      title: 'Generate Cross-Platform Restore Scripts',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string(),
      planId: z.string(),
      items: z.array(
        z.object({
          packageName: z.string(),
          previousAction: z.enum(['uninstall-keep-data', 'disable-user']),
        })
      ),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['serial', 'planId', 'items'],
      properties: {
        serial: { type: 'string' },
        planId: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['packageName', 'previousAction'],
            properties: {
              packageName: { type: 'string' },
              previousAction: { type: 'string', enum: ['uninstall-keep-data', 'disable-user'] },
            },
          },
        },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          serial: z.string(),
          planId: z.string(),
          items: z.array(
            z.object({
              packageName: z.string(),
              previousAction: z.enum(['uninstall-keep-data', 'disable-user']),
            })
          ),
        })
        .parse(raw);
      const data = generateRestoreScripts(parsed);
      return {
        summary: `Generated restore scripts: ${data.shPath} (POSIX) and ${data.ps1Path} (PowerShell).`,
        data,
      };
    },
  },
  {
    name: 'execute_plan',
    description: 'Executes an approved removal plan. Requires a valid, unexpired, single-use human approval token bound to the plan SHA-256 hash and device serial. Defaults to dryRun=true.',
    category: 'destructive',
    annotations: {
      title: 'Execute Approved Removal Plan',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    zodSchema: z.object({
      planId: z.string().min(1),
      approvalToken: z.string().min(1),
      dryRun: z.boolean().optional().default(true),
      serial: z.string().optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['planId', 'approvalToken'],
      properties: {
        planId: { type: 'string' },
        approvalToken: { type: 'string', description: 'Single-use out-of-band human approval token' },
        dryRun: { type: 'boolean', description: 'Defaults to true. Set to false to execute live commands.' },
        serial: { type: 'string' },
      },
    },
    execute: async (raw) => {
      const parsed = z
        .object({
          planId: z.string().min(1),
          approvalToken: z.string().min(1),
          dryRun: z.boolean().optional(),
          serial: z.string().optional(),
        })
        .parse(raw);
      const data = await executeApprovedPlan(parsed);
      return {
        summary: data.dryRun
          ? `[DRY-RUN] Verified ${data.results.length} command(s) for plan ${data.planId}. Pass dryRun=false with a valid token to execute.`
          : `Executed ${data.results.length} command(s) for plan ${data.planId} (health=${data.healthCheck.healthy ? 'OK' : 'FAILED'}).`,
        data,
      };
    },
  },
  {
    name: 'execute_restore',
    description: 'Restores uninstalled or disabled user-0 packages using allowlisted install-existing and pm enable commands.',
    category: 'destructive',
    annotations: {
      title: 'Execute Package Restoration',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional(),
      packages: z.array(
        z.object({
          packageName: z.string(),
          restoreCommand: z.string().optional(),
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
              restoreCommand: { type: 'string' },
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
              restoreCommand: z.string().optional(),
            })
          ),
        })
        .parse(raw);
      const data = await executeRestorePlan(parsed);
      return {
        summary: `Restored ${data.restoredCount}/${data.results.length} package(s) on ${data.serial}.`,
        data,
      };
    },
  },
];
