import path from 'node:path';
import os from 'node:os';
import { z } from 'zod';

const ConfigSchema = z.object({
  adbPath: z.string().optional(),
  useMockAdb: z.boolean().default(false),
  adbTimeoutMs: z.number().int().min(1000).max(120000).default(15000),
  dataDir: z.string(),
  maxBatchSize: z.number().int().min(1).max(25).default(25),
  healthCheckIntervalBatch: z.number().int().min(1).max(10).default(5),
  approvalTokenTtlMs: z.number().int().min(60000).max(3600000).default(10 * 60 * 1000),
  defaultDryRun: z.boolean().default(true),
  mcpHttpEnabled: z.boolean().default(false),
  mcpHttpPort: z.number().int().min(1024).max(65535).default(3100),
  mcpHttpToken: z.string().optional(),
});

export type ServerConfig = z.infer<typeof ConfigSchema>;

export function getDefaultDataDir(): string {
  if (process.env.UAD_DATA_DIR) {
    return path.resolve(process.env.UAD_DATA_DIR);
  }
  const platform = os.platform();
  const home = os.homedir();
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appData, 'android-debloater-mcp');
  }
  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'android-debloater-mcp');
  }
  const xdgState = process.env.XDG_STATE_HOME || path.join(home, '.local', 'state');
  return path.join(xdgState, 'android-debloater-mcp');
}

let cachedConfig: ServerConfig | null = null;

export function loadConfig(overrides?: Partial<ServerConfig>): ServerConfig {
  if (cachedConfig && !overrides) {
    return cachedConfig;
  }
  const raw = {
    adbPath: process.env.ADB_PATH || undefined,
    useMockAdb: process.env.ADB_MOCK === '1' || process.env.ADB_MOCK === 'true',
    adbTimeoutMs: process.env.ADB_TIMEOUT_MS ? Number(process.env.ADB_TIMEOUT_MS) : 15000,
    dataDir: getDefaultDataDir(),
    maxBatchSize: 25,
    healthCheckIntervalBatch: 5,
    approvalTokenTtlMs: 10 * 60 * 1000,
    defaultDryRun: true,
    mcpHttpEnabled: process.env.MCP_HTTP_ENABLED === 'true',
    mcpHttpPort: process.env.MCP_HTTP_PORT ? Number(process.env.MCP_HTTP_PORT) : 3100,
    mcpHttpToken: process.env.MCP_HTTP_TOKEN || undefined,
    ...overrides,
  };

  const parsed = ConfigSchema.parse(raw);
  if (!overrides) {
    cachedConfig = parsed;
  }
  return parsed;
}

export function setUseMockAdb(enabled: boolean): void {
  process.env.ADB_MOCK = enabled ? '1' : '0';
  cachedConfig = null;
}
