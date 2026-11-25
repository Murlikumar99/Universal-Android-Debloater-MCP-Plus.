# Setting Up `android-debloater-mcp` in Google Antigravity

This guide provides step-by-step instructions for integrating the **Universal Android Debloater MCP Server** with **Google Antigravity**.

---

## 1. Prerequisites

Before configuring Antigravity, ensure:
1. **Node.js**: Installed (`node --version`).
2. **Project Built**: The single-file binary exists at `dist/index.js`. If not built yet, run:
   ```bash
   npm run build
   ```
3. **ADB & Device**: Your Android phone is connected with USB Debugging enabled (`adb devices -l`).

---

## 2. Configuration Location

Google Antigravity reads MCP server configurations from its settings file:

- **Linux / macOS**:
  `~/.gemini/antigravity/mcp_config.json`
- **Windows**:
  `%USERPROFILE%\.gemini\antigravity\mcp_config.json`

---

## 3. Configuration Setup

### Method A: Automatic Setup (Recommended)

Run the included client configuration script from the repository root:

```bash
# Preview the configuration target
npm run setup-clients -- --dry-run

# Apply configuration automatically
npm run setup-clients
```

The setup script automatically creates `.bak` backups of existing configuration files and registers `android-debloater-mcp`.

---

### Method B: Manual Configuration

Open or create `~/.gemini/antigravity/mcp_config.json` and add the `android-debloater` entry under `mcpServers`. Replace `/path/to/android-debloater-mcp` with your actual absolute path:

```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/path/to/android-debloater-mcp/dist/index.js"]
    }
  }
}
```

---

## 4. Verification in Antigravity

1. Launch or restart Google Antigravity.
2. In the Antigravity prompt interface, run a test prompt:
   > *"Run `list_devices` and `get_device_profile` to inspect my connected Android phone."*
3. **Expected Result**: Antigravity will invoke the `list_devices` and `get_device_profile` tools, displaying your device serial, manufacturer, model, and system profile.

---

## 5. Debloating Workflow in Antigravity

1. **Scan & Classify**: Ask Antigravity:
   > *"Classify installed packages on my phone using `classify_apps`."*
2. **Create Plan**: Ask Antigravity to create a removal plan for `Safe` bloatware using `plan_removal`. Antigravity will output a `planId` and plan summary.
3. **Human Approval Gate**: In an interactive terminal on your host machine, run:
   ```bash
   node /path/to/android-debloater-mcp/dist/index.js approve <plan-id>
   ```
   Enter the 6-digit one-time code shown in your terminal to receive a single-use approval token.
4. **Execute**: Supply the single-use token back to Antigravity to execute `execute_plan`.

---

## 6. Emergency Recovery

If you ever need to restore an uninstalled or disabled app:
- Ask Antigravity: *"Restore package <package_name> using `execute_restore`."*
- Or execute the auto-generated restore script in your terminal:
  ```bash
  bash ~/.local/state/android-debloater-mcp/restore-scripts/restore-<planId>.sh
  ```
