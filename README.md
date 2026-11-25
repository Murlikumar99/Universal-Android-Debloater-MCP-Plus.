# Universal Android Debloater MCP Plus

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/Protocol-Model%20Context%20Protocol-6B5CE7)](https://modelcontextprotocol.io/)
[![ADB](https://img.shields.io/badge/Android-ADB-3DDC84?logo=android&logoColor=white)](https://developer.android.com/tools/adb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An open-source **Model Context Protocol (MCP) server for Android debloating and device management**. Connect AI assistants to Android devices through **Android Debug Bridge (ADB)** over USB or Wi-Fi. Inspect installed packages, analyze OEM-specific apps, review permissions, create auditable removal plans, back up APKs, and restore packages with explicit human approval.

Designed for Android 8.0+ and AI development clients such as Claude Desktop, Claude Code, Cursor, and other MCP-compatible clients.

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation & Build](#installation--build)
5. [MCP Integration](#mcp-integration)
6. [Verification Steps](#verification-steps)
7. [Safety & Debloat Workflow](#safety--debloat-workflow)
8. [Repository Topics and Keywords](#repository-topics-and-keywords)

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

## 2. Features

- **Device discovery:** detect Android devices connected over USB or Wireless ADB.
- **Device intelligence:** inspect manufacturer, model, Android version, OEM skin, and device resources.
- **Package inventory:** list installed apps and inspect package metadata and permissions.
- **OEM-aware classification:** use curated safety data and supported community list sources to help classify packages.
- **Removal planning:** generate reviewable plans with SHA-256 integrity hashes.
- **Human approval:** require a separate, explicit terminal approval step before destructive operations.
- **APK backup and restore:** back up supported APK artifacts and provide recovery workflows.
- **Auditability:** maintain structured audit records for important operations.
- **MCP integration:** expose Android management capabilities to compatible AI assistants.

## 3. Prerequisites

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

## 4. Installation & Build

Follow these step-by-step instructions to download, build, and package the server:

1. Clone the repository:
   ```bash
   git clone https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Plus..git
   cd Universal-Android-Debloater-MCP-Plus.
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

## 5. MCP Integration

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

## 6. Verification Steps

To verify that the MCP tools are successfully loaded and communicating with your device in your IDE:

1. Restart your MCP client (Claude Desktop, Cursor, etc.).
2. Open a chat and ask your AI assistant to run the connection check:
   > *"Run `list_devices` to check if my Android device is connected."*
3. Ask your assistant to retrieve device telemetry:
   > *"Run `get_device_profile` to inspect my device manufacturer, model, and OEM skin."*
4. **Expected Result**: Your assistant will execute the tools and display your connected device's serial number, model, and system profile.

---

## 7. Safety & Debloat Workflow

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

## Repository Topics and Keywords

Suggested GitHub repository topics:

`android` · `android-debloater` · `android-debloat` · `android-debug-bridge` · `adb` · `wireless-adb` · `mcp` · `model-context-protocol` · `mcp-server` · `typescript` · `nodejs` · `ai-tools` · `claude` · `cursor` · `android-automation` · `android-tools` · `app-manager` · `open-source`

**Search keywords:** Android debloater, Universal Android Debloater, Android bloatware removal, ADB debloat tool, Android package manager, Wireless ADB, MCP server, Model Context Protocol, AI Android assistant, Android app removal, APK backup, Android app restore, OEM debloat, Samsung debloat, Xiaomi debloat, Vivo debloat, TypeScript MCP.

## License
MIT
