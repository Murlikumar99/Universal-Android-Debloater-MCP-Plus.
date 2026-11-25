import { adbClient } from '../adb/adbClient';
import {
  parseBatteryOutput,
  parseDfOutput,
  parseProcMeminfo,
  parseTopProcesses,
  ParsedBatteryInfo,
  ParsedMemInfo,
  ParsedProcessEntry,
  ParsedStorageInfo,
} from '../adb/parsers';

export interface DeviceResourceSnapshot {
  serial: string;
  capturedAt: string;
  memory: ParsedMemInfo;
  storage: ParsedStorageInfo;
  battery: ParsedBatteryInfo;
  topProcesses: ParsedProcessEntry[];
  processCount: number;
  usedMock: boolean;
}

export async function getDeviceResourceUsage(serial?: string): Promise<DeviceResourceSnapshot> {
  const targetSerial = await adbClient.resolveTargetSerial(serial);

  const [memRes, dfRes, batRes, procRes] = await Promise.all([
    adbClient.runShell(targetSerial, ['cat', '/proc/meminfo']),
    adbClient.runShell(targetSerial, ['df', '-k', '/data']),
    adbClient.runShell(targetSerial, ['dumpsys', 'battery']),
    adbClient.runShell(targetSerial, ['ps', '-A', '-o', 'PID,USER,RSS,PCY,NAME']),
  ]);

  const memory = parseProcMeminfo(memRes.result.stdout);
  const storage = parseDfOutput(dfRes.result.stdout);
  const battery = parseBatteryOutput(batRes.result.stdout);
  const processes = parseTopProcesses(procRes.result.stdout);
  const sortedProcs = [...processes].sort((a, b) => b.rssMb - a.rssMb).slice(0, 15);

  return {
    serial: targetSerial,
    capturedAt: new Date().toISOString(),
    memory,
    storage,
    battery,
    topProcesses: sortedProcs,
    processCount: processes.length,
    usedMock: memRes.result.usedMock,
  };
}
