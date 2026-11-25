import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { DebloaterError } from '../util/errors';

export interface AdbLocationResult {
  adbPath: string;
  source: 'config' | 'env' | 'path' | 'standard-sdk-location';
  version?: string;
}

function isExecutableFile(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export function getCandidateAdbPaths(configuredPath?: string): Array<{ path: string; source: AdbLocationResult['source'] }> {
  const isWin = os.platform() === 'win32';
  const binName = isWin ? 'adb.exe' : 'adb';
  const candidates: Array<{ path: string; source: AdbLocationResult['source'] }> = [];

  if (configuredPath) {
    candidates.push({ path: path.resolve(configuredPath), source: 'config' });
  }
  if (process.env.ADB_PATH) {
    candidates.push({ path: path.resolve(process.env.ADB_PATH), source: 'env' });
  }

  const sdkEnvVars = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(Boolean) as string[];
  for (const sdkRoot of sdkEnvVars) {
    candidates.push({
      path: path.join(sdkRoot, 'platform-tools', binName),
      source: 'env',
    });
  }

  const pathEnv = process.env.PATH || '';
  const pathSep = isWin ? ';' : ':';
  for (const dir of pathEnv.split(pathSep).filter(Boolean)) {
    candidates.push({
      path: path.join(dir, binName),
      source: 'path',
    });
  }

  const home = os.homedir();
  if (isWin) {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    candidates.push(
      { path: path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe'), source: 'standard-sdk-location' },
      { path: 'C:\\platform-tools\\adb.exe', source: 'standard-sdk-location' }
    );
  } else if (os.platform() === 'darwin') {
    candidates.push(
      { path: path.join(home, 'Library', 'Android', 'sdk', 'platform-tools', 'adb'), source: 'standard-sdk-location' },
      { path: '/opt/homebrew/bin/adb', source: 'standard-sdk-location' },
      { path: '/usr/local/bin/adb', source: 'standard-sdk-location' }
    );
  } else {
    candidates.push(
      { path: path.join(home, 'Android', 'Sdk', 'platform-tools', 'adb'), source: 'standard-sdk-location' },
      { path: '/usr/bin/adb', source: 'standard-sdk-location' },
      { path: '/usr/local/bin/adb', source: 'standard-sdk-location' }
    );
  }

  return candidates;
}

export function locateAdb(configuredPath?: string): AdbLocationResult {
  const candidates = getCandidateAdbPaths(configuredPath);
  for (const candidate of candidates) {
    if (isExecutableFile(candidate.path)) {
      let version: string | undefined;
      try {
        const out = execFileSync(candidate.path, ['version'], {
          encoding: 'utf8',
          timeout: 4000,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        version = out.split(/\r?\n/)[0]?.trim();
      } catch {
        version = undefined;
      }
      return {
        adbPath: candidate.path,
        source: candidate.source,
        version,
      };
    }
  }

  throw new DebloaterError(
    'ADB_NOT_FOUND',
    'Android Debug Bridge (adb) binary was not found on PATH, ANDROID_HOME, or standard SDK locations.',
    'Install Android SDK Platform-Tools from https://developer.android.com/tools/releases/platform-tools or set the ADB_PATH environment variable.'
  );
}
