export type AdbErrorCode =
  | 'ADB_NOT_FOUND'
  | 'NO_DEVICE'
  | 'MULTIPLE_DEVICES_SERIAL_REQUIRED'
  | 'DEVICE_UNAUTHORIZED'
  | 'DEVICE_OFFLINE'
  | 'DEVICE_NOT_FOUND'
  | 'COMMAND_TIMEOUT'
  | 'COMMAND_FAILED'
  | 'PROHIBITED_COMMAND'
  | 'INVALID_PACKAGE_NAME'
  | 'INVALID_SERIAL'
  | 'UNSAFE_PACKAGE_BLOCKED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_INVALID_OR_EXPIRED'
  | 'BACKUP_FAILED'
  | 'HEALTH_CHECK_FAILED'
  | 'PATH_TRAVERSAL_BLOCKED';

export class DebloaterError extends Error {
  public readonly code: AdbErrorCode;
  public readonly remediation?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: AdbErrorCode,
    message: string,
    remediation?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DebloaterError';
    this.code = code;
    this.remediation = remediation;
    this.details = details;
  }
}
