# Universal Android Debloater MCP Server

An open-source Model Context Protocol (MCP) server that empowers AI coding assistants (such as Claude Desktop, Claude Code, Cursor, and Windsurf) to inspect, audit, classify, and safely debloat Android 8.0+ devices over USB and Wireless ADB.

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Build](#installation--build)
4. [MCP Integration](#mcp-integration)
5. [Verification Steps](#verification-steps)
6. [Safety & Debloat Workflow](#safety--debloat-workflow)

---

## 1. Overview

The **Universal Android Debloater MCP Server** bridges Model Context Protocol clients with the Android Debug Bridge (`adb`). It exposes 23 rigorous tools and resources that allow your AI assistant to:
- Discover connected USB and Wireless ADB devices.
- Analyze OEM device profiles (Samsung OneUI, Xiaomi HyperOS, Vivo OriginOS/FuntouchOS, etc.).
- Audit runtime permissions and resource usage (RAM and storage).
- Classify installed apps using community-backed safety engines (UAD-NG, AppManager, Canta, CleanYourTV).
- Build immutable, SHA-256 hashed removal plans with out-of-band human terminal approval.
- Execute safe `--user 0` package removals with automated APK backups and instant restoration scripts.

---

## 2. Prerequisites

Before setting up the server, ensure your environment meets the following requirements and verify them using the provided commands:

1. **Node.js**: Version 20.0.0 or newer.
   ```bash
   node --version
   ```
2. **Android Platform-Tools (`adb`)**: Installed and added to your system PATH.
   ```bash
   adb --version
   ```
3. **Target Android Device**: Android 8.0+ (API 26+) with **Developer Options** and **USB Debugging** enabled. Verify your device connection:
   ```bash
   adb devices -l
   ```

---

## 3. Installation & Build

Follow these step-by-step instructions to download, build, and package the server:

1. Clone the repository:
   ```bash
   git clone https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-.git
   cd Universal-Android-Debloater-MCP-Server-
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run TypeScript typechecking and unit/integration tests:
   ```bash
   npm run typecheck
   npm test
   ```
4. Build the production bundle:
   ```bash
   npm run build
   ```
   This compiles the single-file server binary at `/path/to/repo/dist/index.js` (replace `/path/to/repo` with your actual absolute path).

---

## 4. MCP Integration

Configure your MCP client to launch the compiled server binary via Node.js. Replace `/path/to/repo/dist/index.js` with your actual absolute path.

### Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/path/to/repo/dist/index.js"]
    }
  }
}
```

### Cursor IDE Configuration (`~/.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/path/to/repo/dist/index.js"]
    }
  }
}
```

---

## 5. Verification Steps

To verify that the MCP tools are successfully loaded and communicating with your device in your IDE:

1. Restart your MCP client (Claude Desktop, Cursor, etc.).
2. Open a chat and ask your AI assistant to run the connection check:
   > *"Run `list_devices` to check if my Android device is connected."*
3. Ask your assistant to retrieve device telemetry:
   > *"Run `get_device_profile` to inspect my device manufacturer, model, and OEM skin."*
4. **Expected Result**: Your assistant will execute the tools and display your connected device's serial number, model, and system profile.

---

## 6. Safety & Debloat Workflow

The server implements a strict defense-in-depth safety architecture:

1. **Non-Destructive Operations**: Never touches system partitions or uses root (`su`). It exclusively runs user-0 commands (`pm uninstall -k --user 0` or `pm disable-user --user 0`), allowing instant package restoration.
2. **Automated Backups**: Before removing any package, the server pulls the base and split APK files to local storage and validates SHA-256 checksums.
3. **Out-of-Band Human Approval Gate**: AI assistants cannot self-approve removal plans. Every mutating plan returns a plan ID and SHA-256 hash. To approve, the human operator must run:
   ```bash
   node /path/to/repo/dist/index.js approve <plan-id>
   ```
   in an interactive terminal (TTY), enter the generated 6-digit one-time verification code, and supply the resulting single-use token back to the AI assistant for execution.
4. **Emergency Restoration**: Any removed package can be restored at any time via `execute_restore`, auto-generated recovery scripts (`bash restore-<planId>.sh`), or manual ADB commands (`adb shell cmd package install-existing --user 0 <package>`).

---

## License
MIT
