import { adbClient } from '../adb/adbClient';
import { DebloaterError } from '../util/errors';
import { HOST_PORT_REGEX, PAIRING_CODE_REGEX } from '../util/validation';

export interface WirelessAdbActionResponse {
  action: 'pair' | 'connect' | 'disconnect';
  target: string;
  success: boolean;
  output: string;
  securityNotice: string;
  usedMock: boolean;
}

const WIRELESS_SECURITY_NOTICE =
  'Only use Wireless ADB on trusted private networks. Disable Wireless Debugging when finished.';

export async function pairWirelessDevice(
  hostPort: string,
  pairingCode: string
): Promise<WirelessAdbActionResponse> {
  if (!HOST_PORT_REGEX.test(hostPort)) {
    throw new DebloaterError(
      'INVALID_SERIAL',
      `Invalid host:port "${hostPort}". Expected IPv4:port format (e.g., 192.168.1.45:39123).`
    );
  }
  if (!PAIRING_CODE_REGEX.test(pairingCode)) {
    throw new DebloaterError(
      'COMMAND_FAILED',
      'Invalid pairing code. Expected a 6-digit numeric pairing code from Wireless Debugging settings.'
    );
  }

  const res = await adbClient.runAdb(['pair', hostPort, pairingCode]);
  const combined = `${res.stdout}\n${res.stderr}`.trim();
  const success = res.exitCode === 0 && combined.toLowerCase().includes('successfully paired');

  return {
    action: 'pair',
    target: hostPort,
    success,
    output: combined,
    securityNotice: WIRELESS_SECURITY_NOTICE,
    usedMock: res.usedMock,
  };
}

export async function connectWirelessDevice(hostPort: string): Promise<WirelessAdbActionResponse> {
  if (!HOST_PORT_REGEX.test(hostPort)) {
    throw new DebloaterError(
      'INVALID_SERIAL',
      `Invalid host:port "${hostPort}". Expected IPv4:port format (e.g., 192.168.1.45:5555).`
    );
  }

  const res = await adbClient.runAdb(['connect', hostPort]);
  const combined = `${res.stdout}\n${res.stderr}`.trim();
  const success =
    res.exitCode === 0 &&
    (combined.toLowerCase().includes('connected to') || combined.toLowerCase().includes('already connected'));

  return {
    action: 'connect',
    target: hostPort,
    success,
    output: combined,
    securityNotice: WIRELESS_SECURITY_NOTICE,
    usedMock: res.usedMock,
  };
}

export async function disconnectWirelessDevice(hostPort?: string): Promise<WirelessAdbActionResponse> {
  if (hostPort && !HOST_PORT_REGEX.test(hostPort)) {
    throw new DebloaterError('INVALID_SERIAL', `Invalid host:port "${hostPort}".`);
  }

  const args = hostPort ? ['disconnect', hostPort] : ['disconnect'];
  const res = await adbClient.runAdb(args);
  const combined = `${res.stdout}\n${res.stderr}`.trim();

  return {
    action: 'disconnect',
    target: hostPort || 'all-wireless',
    success: res.exitCode === 0,
    output: combined,
    securityNotice: WIRELESS_SECURITY_NOTICE,
    usedMock: res.usedMock,
  };
}
