#!/usr/bin/env bash
set -euo pipefail

echo "Universal Android Debloater MCP Server — Installer (Linux/macOS)"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 20+ is required. Install from https://nodejs.org/" >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Error: Node.js 20 LTS or newer is required (detected v$(node -v))." >&2
  exit 1
fi

echo "Installing npm dependencies..."
npm install

echo "Running typecheck and build..."
npm run typecheck
npm run build

if command -v adb >/dev/null 2>&1; then
  echo "Detected ADB binary: $(command -v adb)"
else
  echo "Notice: 'adb' was not found on PATH. Install Android SDK Platform-Tools from:"
  echo "  https://developer.android.com/tools/releases/platform-tools"
fi

node scripts/setup-clients.mjs
