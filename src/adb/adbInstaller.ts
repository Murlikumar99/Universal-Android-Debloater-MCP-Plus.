import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';

export interface PlatformToolsPackageInfo {
  platform: 'linux' | 'darwin' | 'win32';
  downloadUrl: string;
  documentationUrl: string;
  installInstructions: string[];
}

export function getPlatformToolsInstallGuidance(): PlatformToolsPackageInfo {
  const rawPlatform = os.platform();
  const platform: 'linux' | 'darwin' | 'win32' =
    rawPlatform === 'win32' ? 'win32' : rawPlatform === 'darwin' ? 'darwin' : 'linux';

  const urls: Record<'linux' | 'darwin' | 'win32', string> = {
    linux: 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip',
    darwin: 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip',
    win32: 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip',
  };

  const instructions: Record<'linux' | 'darwin' | 'win32', string[]> = {
    linux: [
      'Run ./scripts/install.sh --with-adb to download and verify the SHA-256 checksum from Google.',
      'Or install via package manager: sudo apt install android-sdk-platform-tools (Debian/Ubuntu) or sudo pacman -S android-tools (Arch).',
    ],
    darwin: [
      'Run ./scripts/install.sh --with-adb to download and verify the SHA-256 checksum from Google.',
      'Or install via Homebrew: brew install --cask android-platform-tools',
    ],
    win32: [
      'Run .\\scripts\\install.ps1 -InstallAdb to download and verify the SHA-256 checksum from Google.',
      'Or install via Winget: winget install Google.PlatformTools',
    ],
  };

  return {
    platform,
    downloadUrl: urls[platform],
    documentationUrl: 'https://developer.android.com/tools/releases/platform-tools',
    installInstructions: instructions[platform],
  };
}

export function verifyFileSha256(filePath: string, expectedSha256Hex: string): boolean {
  const fileBuffer = fs.readFileSync(filePath);
  const actual = crypto.createHash('sha256').update(fileBuffer).digest('hex').toLowerCase();
  return actual === expectedSha256Hex.trim().toLowerCase();
}
