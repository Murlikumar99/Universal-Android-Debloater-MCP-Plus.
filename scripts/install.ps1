$ErrorActionPreference = "Stop"

Write-Host "Universal Android Debloater MCP Server — Installer (Windows PowerShell)"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js 20+ is required. Install from https://nodejs.org/"
  exit 1
}

Write-Host "Installing npm dependencies..."
npm install

Write-Host "Running typecheck and build..."
npm run typecheck
npm run build

if (Get-Command adb.exe -ErrorAction SilentlyContinue) {
  Write-Host "Detected ADB binary on PATH."
} else {
  Write-Host "Notice: adb.exe was not found on PATH. Install via: winget install Google.PlatformTools"
}

node scripts/setup-clients.mjs
