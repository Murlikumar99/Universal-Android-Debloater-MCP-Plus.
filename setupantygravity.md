# Antigravity Setup Guide — Universal Android Debloater MCP

This guide explains how to connect and use the **Universal Android Debloater MCP Server** with **Google Antigravity** using either the OpenDesign CLI or standard configuration files.

---

## What is Antigravity?

**Antigravity** is Google's agentic development environment and coding agent platform. By connecting the Universal Android Debloater MCP server, Antigravity agents gain secure, fine-grained access to Android ADB tools while strictly respecting your approval workflows and safety rules.

---

## Fast Setup via OpenDesign CLI

If you have OpenDesign (`nexu-io/open-design`) installed, you can register the MCP server with a single command:

```bash
# Register this MCP server in your Antigravity environment
od mcp install antigravity
```

---

## Manual Setup Guide

### 1. Build the Project
Ensure the single-file distribution binary is built:

```bash
# Clone the repository (if not already done)
git clone https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-.git
cd Universal-Android-Debloater-MCP-Server-

# Install dependencies and build
npm install
npm run build
```

This creates the executable file at:
`<PROJECT_PATH>/dist/index.js`

### 2. Locate the Antigravity Configuration File

Antigravity stores its registered MCP servers in a standard configuration JSON:

- **Linux / macOS**:
  `~/.gemini/antigravity/mcp_config.json`
- **Windows**:
  `%USERPROFILE%\.gemini\antigravity\mcp_config.json`

### 3. Add the Server Entry

Add the `android-debloater` entry under the `mcpServers` object in your `mcp_config.json` file. Replace `/ABSOLUTE/PATH/TO` with your actual project location:

```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/Universal-Android-Debloater-MCP-Server-/dist/index.js"
      ],
      "env": {
        "ADB_MOCK": "0",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

*Note: If you want to test without connecting a physical phone first, set `"ADB_MOCK": "1"` to run against simulated devices safely.*

### 4. Restart Antigravity & Test Tools

1. Restart your Antigravity session.
2. In your Antigravity agent chat, enter:
   > "List connected Android devices and check device health."
3. The agent will call the `list_devices` and `get_device_profile` tools.

---

## Complete Debloating Workflow in Antigravity

When debloating via Antigravity, the process is completely human-gated:

1. **Discovery**: Antigravity scans your device:
   ```json
   { "tool": "list_devices" }
   ```
2. **Classification**: Apps are evaluated against the UAD + AppManager + Canta databases:
   ```json
   { "tool": "classify_apps", "serial": "YOUR_SERIAL", "filterTier": "Safe" }
   ```
3. **Plan Creation**: The agent plans removals (risky packages require explicit acknowledgment):
   ```json
   { "tool": "plan_removal", "packages": [{ "packageName": "com.facebook.services", "action": "disable" }] }
   ```
4. **Human Approval**: You approve the plan in your terminal:
   ```bash
   node dist/index.js approve <PLAN_ID>
   ```
5. **Execution**: The agent runs the plan with your one-time token:
   ```json
   { "tool": "execute_plan", "planId": "PLAN_ID", "approvalToken": "YOUR_TOKEN", "dryRun": false }
   ```
6. **Automatic Backup & Restore**: APKs are backed up before removal, and restore scripts are generated automatically.
