import { z } from 'zod';
import { McpToolDefinition } from './types';
import { listConnectedDevices } from '../device/discovery';
import { getDeviceProfile } from '../device/profile';
import { getDeviceResourceUsage } from '../device/resources';

export const discoveryTools: McpToolDefinition[] = [
  {
    name: 'list_devices',
    description: 'Lists all connected Android devices over USB and Wireless ADB along with authorization and online state.',
    category: 'read-only',
    annotations: {
      title: 'List Connected Android Devices',
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
      const data = await listConnectedDevices();
      return {
        summary: `Found ${data.totalConnected} device(s) (${data.authorizedCount} authorized).`,
        data,
      };
    },
  },
  {
    name: 'get_device_profile',
    description: 'Reads hardware, Android SDK version, security patch, and OEM skin properties (OneUI, HyperOS/MIUI, ColorOS, OxygenOS, OriginOS, Pixel/AOSP).',
    category: 'read-only',
    annotations: {
      title: 'Get Device Profile & OEM Skin',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    zodSchema: z.object({
      serial: z.string().optional().describe('Target device serial (required when >1 device is connected)'),
    }),
    inputSchemaJson: {
      type: 'object',
      properties: {
        serial: { type: 'string', description: 'Target device serial (required when >1 device is connected)' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ serial: z.string().optional() }).parse(raw);
      const data = await getDeviceProfile(parsed.serial);
      return {
        summary: `${data.manufacturer} ${data.model} running Android ${data.androidVersion} (SDK ${data.sdkInt}) with ${data.oemSkin.displayName}.`,
        data,
      };
    },
  },
  {
    name: 'get_resource_usage',
    description: 'Captures RAM (/proc/meminfo), swap, /data storage usage, battery telemetry, and top memory-consuming processes.',
    category: 'read-only',
    annotations: {
      title: 'Get Device Resource Usage',
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
        serial: { type: 'string', description: 'Target device serial' },
      },
    },
    execute: async (raw) => {
      const parsed = z.object({ serial: z.string().optional() }).parse(raw);
      const data = await getDeviceResourceUsage(parsed.serial);
      return {
        summary: `Available RAM: ${data.memory.availableRamMb} MB / ${data.memory.totalRamMb} MB; Free /data storage: ${data.storage.dataPartitionFreeGb} GB; Battery: ${data.battery.levelPercent}%.`,
        data,
      };
    },
  },
];
