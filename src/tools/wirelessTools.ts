import { z } from 'zod';
import { McpToolDefinition } from './types';
import { pairWirelessDevice, connectWirelessDevice, disconnectWirelessDevice } from '../device/wireless';

export const wirelessTools: McpToolDefinition[] = [
  {
    name: 'adb_pair',
    description: 'Pairs with an Android 11+ device over Wireless Debugging using IP:port and 6-digit pairing code.',
    category: 'wireless',
    annotations: {
      title: 'Pair Wireless ADB',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    zodSchema: z.object({
      hostPort: z.string().min(1),
      pairingCode: z.string().min(6).max(6),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['hostPort', 'pairingCode'],
      properties: {
        hostPort: { type: 'string', description: 'IPv4:port shown in Pair device with pairing code dialog' },
        pairingCode: { type: 'string', description: '6-digit numeric pairing code' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ hostPort: z.string(), pairingCode: z.string() }).parse(raw);
      const data = await pairWirelessDevice(parsed.hostPort, parsed.pairingCode);
      return {
        summary: `${data.output} (${data.securityNotice})`,
        data,
      };
    },
  },
  {
    name: 'adb_connect',
    description: 'Connects to a paired Android device over Wireless ADB (IP:port).',
    category: 'wireless',
    annotations: {
      title: 'Connect Wireless ADB',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      hostPort: z.string().min(1),
    }),
    inputSchemaJson: {
      type: 'object',
      required: ['hostPort'],
      properties: {
        hostPort: { type: 'string', description: 'IPv4:port for Wireless ADB connection' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ hostPort: z.string() }).parse(raw);
      const data = await connectWirelessDevice(parsed.hostPort);
      return {
        summary: `${data.output} (${data.securityNotice})`,
        data,
      };
    },
  },
  {
    name: 'adb_disconnect',
    description: 'Disconnects a Wireless ADB session.',
    category: 'wireless',
    annotations: {
      title: 'Disconnect Wireless ADB',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      hostPort: z.string().optional(),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        hostPort: { type: 'string' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ hostPort: z.string().optional() }).parse(raw);
      const data = await disconnectWirelessDevice(parsed.hostPort);
      return {
        summary: data.output,
        data,
      };
    },
  },
];
