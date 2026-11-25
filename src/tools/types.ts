import { z } from 'zod';

export interface McpToolAnnotations {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  category: 'read-only' | 'wireless' | 'planning' | 'destructive';
  annotations: McpToolAnnotations;
  inputSchemaJson: Record<string, unknown>;
  zodSchema: z.ZodTypeAny;
  execute: (args: Record<string, unknown>) => Promise<{
    summary: string;
    data: unknown;
  }>;
}
