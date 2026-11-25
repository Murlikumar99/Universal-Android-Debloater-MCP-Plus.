import { adbClient } from '../adb/adbClient';
import { parseAdbDevicesOutput, ParsedAdbDevice } from '../adb/parsers';

export interface DeviceDiscoveryResponse {
  usedMock: boolean;
  totalConnected: number;
  authorizedCount: number;
  devices: ParsedAdbDevice[];
  guidance?: string;
}

export async function listConnectedDevices(): Promise<DeviceDiscoveryResponse> {
  const res = await adbClient.runAdb(['devices', '-l']);
  const devices = parseAdbDevicesOutput(res.stdout);
  const authorizedCount = devices.filter((d) => d.state === 'device').length;

  let guidance: string | undefined;
  if (devices.length === 0) {
    guidance =
      'No devices detected. Enable Developer Options and USB Debugging on your phone, connect via USB or Wireless ADB, and verify cable data support.';
  } else if (devices.some((d) => d.state === 'unauthorized')) {
    guidance =
      'One or more devices are in "unauthorized" state. Unlock the phone screen and tap "Allow" on the USB debugging RSA key dialog.';
  } else if (authorizedCount > 1) {
    guidance =
      'Multiple authorized devices are connected. Pass the explicit "serial" parameter to all device-specific MCP tools.';
  }

  return {
    usedMock: res.usedMock,
    totalConnected: devices.length,
    authorizedCount,
    devices,
    guidance,
  };
}
