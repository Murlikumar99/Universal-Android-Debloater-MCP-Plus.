import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MCP_TOOLS } from './tools/index';
import { getDeviceProfile } from './device/profile';
import { getDeviceResourceUsage } from './device/resources';

export function createDebloaterMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'android-debloater-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        prompts: { listChanged: true },
      },
    }
  );

  // Tools
  for (const toolDef of MCP_TOOLS) {
    const rawShape = (toolDef.zodSchema as z.ZodObject<z.ZodRawShape>).shape || {};
    server.tool(
      toolDef.name,
      toolDef.description,
      rawShape,
      async (args) => {
        const res = await toolDef.execute(args);
        return {
          content: [
            {
              type: 'text',
              text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2),
            },
          ],
        };
      }
    );
  }

  // Resources
  server.resource(
    'device-profile',
    'device://profile',
    async (uri) => {
      const profile = await getDeviceProfile();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(profile, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'device-telemetry',
    'device://telemetry',
    async (uri) => {
      const usage = await getDeviceResourceUsage();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(usage, null, 2),
          },
        ],
      };
    }
  );

  // Prompts
  server.prompt(
    'debloat_audit_prompt',
    'Generates a step-by-step device audit and debloating guide prompt',
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'Inspect connected Android device, audit runtime permissions, classify apps with Safety Engine, and prepare a removal plan for Safe bloatware.',
          },
        },
      ],
    })
  );

  return server;
}
