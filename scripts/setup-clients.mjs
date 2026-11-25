#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const isDryRun = process.argv.includes('--dry-run');
const distEntry = path.resolve(process.cwd(), 'dist', 'index.js');
const home = os.homedir();

console.log(`[setup-clients] ${isDryRun ? 'DRY-RUN MODE: Previewing configuration targets...' : 'Configuring MCP clients...'}\n`);
console.log(`Target executable: node ${JSON.stringify(distEntry)}\n`);

const clientConfigs = [
  {
    name: 'Claude Code Project Config',
    type: 'json',
    filePath: path.join(process.cwd(), '.claude', 'mcp.json'),
  },
  {
    name: 'Claude Desktop',
    type: 'json',
    filePath:
      process.platform === 'win32'
        ? path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json')
        : process.platform === 'darwin'
          ? path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
          : path.join(home, '.config', 'Claude', 'claude_desktop_config.json'),
  },
  {
    name: 'Cursor IDE',
    type: 'json',
    filePath: path.join(home, '.cursor', 'mcp.json'),
  },
  {
    name: 'Windsurf IDE',
    type: 'json',
    filePath: path.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
  },
  {
    name: 'Google Antigravity',
    type: 'json',
    filePath: path.join(home, '.gemini', 'antigravity', 'mcp_config.json'),
  },
  {
    name: 'Cline / Roo Code',
    type: 'json',
    filePath: path.join(home, '.vscode', 'cline_mcp_settings.json'),
  },
];

for (const cfg of clientConfigs) {
  try {
    const dir = path.dirname(cfg.filePath);
    if (!fs.existsSync(dir)) {
      console.log(`[-] ${cfg.name}: Directory ${dir} does not exist. Skipping.`);
      continue;
    }

    let existingData = { mcpServers: {} };
    if (fs.existsSync(cfg.filePath)) {
      try {
        const content = fs.readFileSync(cfg.filePath, 'utf8');
        existingData = JSON.parse(content);
        if (!existingData.mcpServers) {
          existingData.mcpServers = {};
        }
      } catch {
        console.log(`[!] ${cfg.name}: Unable to parse existing file at ${cfg.filePath}. Skipping.`);
        continue;
      }
    }

    existingData.mcpServers['android-debloater'] = {
      command: 'node',
      args: [distEntry],
    };

    if (isDryRun) {
      console.log(`[+] [DRY-RUN] ${cfg.name} (${cfg.filePath}): Would configure "android-debloater" server.`);
    } else {
      if (fs.existsSync(cfg.filePath)) {
        const backupPath = `${cfg.filePath}.${Date.now()}.bak`;
        fs.copyFileSync(cfg.filePath, backupPath);
        console.log(`[+] ${cfg.name}: Backup created at ${backupPath}`);
      }
      fs.writeFileSync(cfg.filePath, JSON.stringify(existingData, null, 2), 'utf8');
      console.log(`[+] ${cfg.name}: Successfully updated ${cfg.filePath}`);
    }
  } catch (err) {
    console.log(`[!] ${cfg.name}: Error configuring: ${err.message}`);
  }
}

console.log('\n[setup-clients] Done.');
