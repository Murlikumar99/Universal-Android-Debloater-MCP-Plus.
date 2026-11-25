import { DebloaterError } from './errors';

/**
 * Exhaustive package name validation regex required by Section 7.1:
 * ^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$
 */
export const PACKAGE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;

/**
 * Exception solely for the core "android" framework package when reading/classifying,
 * though "android" is NEVER allowed in mutating commands.
 */
export function isValidPackageName(pkg: string, allowCoreAndroidReadOnly = false): boolean {
  if (!pkg || pkg.length > 255) return false;
  if (allowCoreAndroidReadOnly && pkg === 'android') return true;
  return PACKAGE_NAME_REGEX.test(pkg);
}

export function assertValidPackageName(pkg: string, allowCoreAndroidReadOnly = false): void {
  if (!isValidPackageName(pkg, allowCoreAndroidReadOnly)) {
    throw new DebloaterError(
      'INVALID_PACKAGE_NAME',
      `Invalid or unsafe package identifier: "${pkg}". Must match ${PACKAGE_NAME_REGEX.source}.`
    );
  }
}

/**
 * Device serial validation (USB serials or IPv4:port wireless serials).
 * Rejects leading dashes (flag injection), whitespace, quotes, and shell metacharacters.
 */
export const DEVICE_SERIAL_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,63}$/;

export function assertValidSerial(serial: string): void {
  if (!serial || !DEVICE_SERIAL_REGEX.test(serial) || serial.includes('..')) {
    throw new DebloaterError(
      'INVALID_SERIAL',
      `Invalid device serial format: "${serial}".`
    );
  }
}

export const HOST_PORT_REGEX = /^(\d{1,3}\.){3}\d{1,3}:\d{2,5}$/;
export const PAIRING_CODE_REGEX = /^\d{6}$/;
