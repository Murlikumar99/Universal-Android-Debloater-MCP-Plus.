import { McpToolDefinition } from './types';
import { discoveryTools } from './discoveryTools';
import { inventoryTools } from './inventoryTools';
import { intelligenceTools } from './intelligenceTools';
import { wirelessTools } from './wirelessTools';
import { backupTools } from './backupTools';
import { debloatTools } from './debloatTools';
import { appendAuditLog } from '../audit/auditLog';

export type { McpToolAnnotations, McpToolDefinition } from './types';

export const MCP_TOOLS: McpToolDefinition[] = [
  ...discoveryTools,
  ...inventoryTools,
  ...intelligenceTools,
  ...wirelessTools,
  ...backupTools,
  ...debloatTools,
];

export async function invokeMcpTool(
  toolName: string,
  args: Record<string, unknown> = {}
): Promise<{
  toolName: string;
  summary: string;
  data: unknown;
}> {
  const tool = MCP_TOOLS.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Unknown MCP tool: "${toolName}"`);
  }

  appendAuditLog({
    eventType: 'TOOL_CALL',
    serial: typeof args.serial === 'string' ? args.serial : undefined,
    summary: `Invoked MCP tool "${toolName}"`,
  });

  const res = await tool.execute(args);
  return {
    toolName,
    summary: res.summary,
    data: res.data,
  };
}
