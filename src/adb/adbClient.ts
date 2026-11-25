import { execFile } from 'node:child_process';
import { loadConfig } from '../config';
import { locateAdb } from './adbLocator';
import { mockAdb } from './mockAdb';
import { parseAdbDevicesOutput } from './parsers';
import { DebloaterError } from '../util/errors';
import { assertValidSerial } from '../util/validation';
import { logger } from '../util/logger';

export interface AdbCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  usedMock: boolean;
}

export class AdbClient {
  private resolvedAdbBinary: string | null = null;

  public isMockMode(): boolean {
    const cfg = loadConfig();
    if (cfg.useMockAdb) return true;
    try {
      locateAdb(cfg.adbPath);
      return false;
    } catch {
      return true;
    }
  }

  private getAdbBinary(): string {
    if (this.resolvedAdbBinary) return this.resolvedAdbBinary;
    const cfg = loadConfig();
    const loc = locateAdb(cfg.adbPath);
    this.resolvedAdbBinary = loc.adbPath;
    return loc.adbPath;
  }

  /**
   * Executes an ADB command using child_process.execFile with an argument array ONLY.
   * Never uses shell string concatenation to prevent command injection.
   */
  public async runAdb(args: string[], timeoutMs?: number): Promise<AdbCommandResult> {
    const start = Date.now();
    const cfg = loadConfig();
    const effectiveTimeout = timeoutMs ?? cfg.adbTimeoutMs;

    if (this.isMockMode()) {
      const res = mockAdb.execute(args);
      return {
        ...res,
        durationMs: Date.now() - start,
        usedMock: true,
      };
    }

    const adbBin = this.getAdbBinary();

    return new Promise<AdbCommandResult>((resolve, reject) => {
      execFile(
        adbBin,
        args,
        {
          timeout: effectiveTimeout,
          maxBuffer: 32 * 1024 * 1024,
          windowsHide: true,
          shell: false,
        },
        (error, stdout, stderr) => {
          const durationMs = Date.now() - start;
          if (error) {
            const errAny = error as NodeJS.ErrnoException & { killed?: boolean; code?: number | string };
            if (errAny.killed) {
              reject(
                new DebloaterError(
                  'COMMAND_TIMEOUT',
                  `ADB command timed out after ${effectiveTimeout}ms: adb ${args.join(' ')}`
                )
              );
              return;
            }
            const combined = `${stdout}\n${stderr}`.toLowerCase();
            if (combined.includes('device unauthorized')) {
              reject(
                new DebloaterError(
                  'DEVICE_UNAUTHORIZED',
                  'Device is unauthorized. Unlock the device and accept the USB debugging RSA prompt.'
                )
              );
              return;
            }
            if (combined.includes('device offline')) {
              reject(new DebloaterError('DEVICE_OFFLINE', 'Device is offline.'));
              return;
            }
            const exitCode = typeof errAny.code === 'number' ? errAny.code : 1;
            logger.debug({ args, exitCode, durationMs }, 'ADB command exited with non-zero code');
            resolve({
              stdout: stdout || '',
              stderr: stderr || error.message,
              exitCode,
              durationMs,
              usedMock: false,
            });
            return;
          }

          resolve({
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: 0,
            durationMs,
            usedMock: false,
          });
        }
      );
    });
  }

  /**
   * Resolves and validates the target device serial.
   * When >1 online device is connected, serial is strictly required (Section 9).
   */
  public async resolveTargetSerial(serial?: string): Promise<string> {
    if (serial) {
      assertValidSerial(serial);
    }

    const devicesOut = await this.runAdb(['devices', '-l']);
    const devices = parseAdbDevicesOutput(devicesOut.stdout);

    if (serial) {
      const match = devices.find((d) => d.serial === serial);
      if (!match) {
        throw new DebloaterError(
          'DEVICE_NOT_FOUND',
          `Device with serial "${serial}" was not found among connected devices.`
        );
      }
      if (match.state === 'unauthorized') {
        throw new DebloaterError(
          'DEVICE_UNAUTHORIZED',
          `Device "${serial}" is unauthorized. Check your phone screen and tap "Allow USB debugging".`
        );
      }
      if (match.state === 'offline') {
        throw new DebloaterError(
          'DEVICE_OFFLINE',
          `Device "${serial}" is offline. Reconnect USB or wireless ADB.`
        );
      }
      return match.serial;
    }

    const authorized = devices.filter((d) => d.state === 'device');
    if (authorized.length === 0) {
      const unauth = devices.find((d) => d.state === 'unauthorized');
      if (unauth) {
        throw new DebloaterError(
          'DEVICE_UNAUTHORIZED',
          `Device "${unauth.serial}" is connected but unauthorized. Accept the USB debugging prompt on the phone.`
        );
      }
      throw new DebloaterError(
        'NO_DEVICE',
        'No Android device is connected. Connect a device via USB or Wireless ADB.'
      );
    }

    if (authorized.length > 1) {
      throw new DebloaterError(
        'MULTIPLE_DEVICES_SERIAL_REQUIRED',
        `Multiple devices are connected (${authorized.map((d) => d.serial).join(', ')}). Specify the "serial" argument explicitly.`
      );
    }

    return authorized[0]!.serial;
  }

  public async runShell(serial: string | undefined, shellArgs: string[], timeoutMs?: number): Promise<{
    serial: string;
    result: AdbCommandResult;
  }> {
    const targetSerial = await this.resolveTargetSerial(serial);
    const result = await this.runAdb(['-s', targetSerial, 'shell', ...shellArgs], timeoutMs);
    return { serial: targetSerial, result };
  }
}

export const adbClient = new AdbClient();
