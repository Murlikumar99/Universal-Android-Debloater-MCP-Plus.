# MCP Client Configuration Guide (`docs/CLIENTS.md`)

All configurations below use the standard stdio transport of `android-debloater-mcp`.

## 1. Node.js Production Binary Execution

Once built (`npm run build`), you can launch the server using `node`:
```bash
node /path/to/android-debloater-mcp/dist/index.js
```
Or via `npx` once published to npm:
```bash
npx android-debloater-mcp
```

---

## 2. Config Snippets by Client

### Claude Code CLI & Claude Desktop
- **Config File**: `~/.mcp.json` or `claude_desktop_config.json`
- **Format**: JSON

```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/absolute/path/to/android-debloater-mcp/dist/index.js"]
    }
  }
}
```

### Google Antigravity & Gemini CLI
- **Config File**: `~/.gemini/antigravity/mcp_config.json`
- **Format**: JSON
- **Full Guide**: See [`docs/SETUP_ANTIGRAVITY.md`](./SETUP_ANTIGRAVITY.md)

```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/absolute/path/to/android-debloater-mcp/dist/index.js"]
    }
  }
}
```

### OpenAI Codex CLI
- **Config File**: `~/.codex/config.toml`
- **Format**: TOML

```toml
[mcp_servers.android_debloater]
command = "node"
args = ["/absolute/path/to/android-debloater-mcp/dist/index.js"]
```

### Cursor IDE
- **Config File**: `~/.cursor/mcp.json`
- **Format**: JSON

```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/absolute/path/to/android-debloater-mcp/dist/index.js"]
    }
  }
}
```

### Windsurf IDE
- **Config File**: `~/.codeium/windsurf/mcp_config.json`
- **Format**: JSON

```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/absolute/path/to/android-debloater-mcp/dist/index.js"]
    }
  }
}
```

### Cline / Roo Code (VS Code Extension)
- **Config File**: `~/.vscode/cline_mcp_settings.json`
- **Format**: JSON

```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/absolute/path/to/android-debloater-mcp/dist/index.js"]
    }
  }
}
```

### Continue (VS Code & JetBrains)
- **Config File**: `~/.continue/config.json`
- **Format**: JSON

```json
{
  "mcpServers": [
    {
      "name": "android-debloater",
      "command": "node",
      "args": ["/absolute/path/to/android-debloater-mcp/dist/index.js"]
    }
  ]
}
```

---

## 3. Auto-Configurator Tool (`scripts/setup-clients.mjs`)

You can automatically apply configuration to detected clients using the included setup script:
```bash
# Preview changes without modifying config files
npm run setup-clients -- --dry-run

# Apply configuration to detected client configuration files
npm run setup-clients
```
The auto-configurator automatically creates `.bak` backups before making any edits and preserves all existing unrelated client configurations.
