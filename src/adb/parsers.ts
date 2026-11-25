export interface ParsedAdbDevice {
  serial: string;
  state: 'device' | 'unauthorized' | 'offline' | 'recovery' | 'sideload' | 'unknown';
  usb?: string;
  product?: string;
  model?: string;
  device?: string;
  transportId?: string;
  isWireless: boolean;
}

export interface ParsedMemInfo {
  totalRamMb: number;
  freeRamMb: number;
  availableRamMb: number;
  cachedRamMb: number;
  swapTotalMb: number;
  swapFreeMb: number;
  swapUsedMb: number;
}

export interface ParsedStorageInfo {
  dataPartitionTotalGb: number;
  dataPartitionUsedGb: number;
  dataPartitionFreeGb: number;
  dataPartitionUsePercent: number;
}

export interface ParsedBatteryInfo {
  levelPercent: number;
  status: string;
  temperatureCelsius: number;
  plugged: string;
}

export interface ParsedProcessEntry {
  pid: number;
  user: string;
  rssMb: number;
  cpuPercent: number;
  processName: string;
}

export interface ParsedPackageListItem {
  packageName: string;
  apkPath: string;
  uid?: number;
  isSystem: boolean;
  isUpdatedSystem?: boolean;
  enabled: boolean;
}

export interface ParsedPackageDetails {
  packageName: string;
  versionName: string;
  versionCode: number;
  firstInstallTime?: string;
  lastUpdateTime?: string;
  installerPackageName?: string;
  sharedUserId?: string;
  isSystem: boolean;
  isUpdatedSystem: boolean;
  enabled: boolean;
  apkPaths: string[];
  requestedPermissions: string[];
  grantedPermissions: string[];
  apkSizeBytes: number;
}

export function parseAdbDevicesOutput(raw: string): ParsedAdbDevice[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ParsedAdbDevice[] = [];

  for (const line of lines) {
    if (line.startsWith('List of devices attached') || line.startsWith('* daemon')) {
      continue;
    }
    const parts = line.split(/\s+/);
    const serial = parts[0];
    const rawState = parts[1];
    if (!serial || !rawState) continue;

    const state: ParsedAdbDevice['state'] =
      rawState === 'device' ||
      rawState === 'unauthorized' ||
      rawState === 'offline' ||
      rawState === 'recovery' ||
      rawState === 'sideload'
        ? rawState
        : 'unknown';

    const kv: Record<string, string> = {};
    for (let i = 2; i < parts.length; i++) {
      const token = parts[i];
      if (!token) continue;
      const idx = token.indexOf(':');
      if (idx > 0) {
        kv[token.slice(0, idx)] = token.slice(idx + 1);
      }
    }

    results.push({
      serial,
      state,
      usb: kv.usb,
      product: kv.product,
      model: kv.model,
      device: kv.device,
      transportId: kv.transport_id,
      isWireless: serial.includes(':'),
    });
  }

  return results;
}

export function parseGetPropOutput(raw: string): Record<string, string> {
  const props: Record<string, string> = {};
  const lines = raw.split(/\r?\n/);
  const regex = /^\[([^\]]+)\]:\s*\[(.*)\]$/;

  for (const line of lines) {
    const match = regex.exec(line.trim());
    if (match && match[1] !== undefined && match[2] !== undefined) {
      props[match[1]] = match[2];
    }
  }
  return props;
}

export function parseProcMeminfo(raw: string): ParsedMemInfo {
  const map: Record<string, number> = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Za-z_()]+):\s+(\d+)\s*kB/i.exec(line.trim());
    if (match && match[1] && match[2]) {
      map[match[1]] = parseInt(match[2], 10);
    }
  }

  const toMb = (kb = 0) => Math.round((kb / 1024) * 10) / 10;
  const totalKb = map.MemTotal ?? 0;
  const freeKb = map.MemFree ?? 0;
  const cachedKb = (map.Cached ?? 0) + (map.Buffers ?? 0);
  const availKb = map.MemAvailable ?? freeKb + cachedKb;
  const swapTotalKb = map.SwapTotal ?? 0;
  const swapFreeKb = map.SwapFree ?? 0;

  return {
    totalRamMb: toMb(totalKb),
    freeRamMb: toMb(freeKb),
    availableRamMb: toMb(availKb),
    cachedRamMb: toMb(cachedKb),
    swapTotalMb: toMb(swapTotalKb),
    swapFreeMb: toMb(swapFreeKb),
    swapUsedMb: toMb(Math.max(0, swapTotalKb - swapFreeKb)),
  };
}

export function parseDfOutput(raw: string): ParsedStorageInfo {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let targetLine = lines.find((l) => l.endsWith(' /data') || l.endsWith(' /storage/emulated'));
  if (!targetLine && lines.length > 1) {
    targetLine = lines[lines.length - 1];
  }
  if (!targetLine) {
    return {
      dataPartitionTotalGb: 0,
      dataPartitionUsedGb: 0,
      dataPartitionFreeGb: 0,
      dataPartitionUsePercent: 0,
    };
  }

  const cols = targetLine.split(/\s+/);
  const totalKb = parseInt(cols[1] ?? '0', 10) || 0;
  const usedKb = parseInt(cols[2] ?? '0', 10) || 0;
  const freeKb = parseInt(cols[3] ?? '0', 10) || 0;
  const pctRaw = (cols[4] ?? '0').replace('%', '');
  const pct = parseInt(pctRaw, 10) || (totalKb > 0 ? Math.round((usedKb / totalKb) * 100) : 0);

  const toGb = (kb: number) => Math.round((kb / (1024 * 1024)) * 100) / 100;

  return {
    dataPartitionTotalGb: toGb(totalKb),
    dataPartitionUsedGb: toGb(usedKb),
    dataPartitionFreeGb: toGb(freeKb),
    dataPartitionUsePercent: pct,
  };
}

export function parseBatteryOutput(raw: string): ParsedBatteryInfo {
  let level = 0;
  let scale = 100;
  let statusCode = 1;
  let tempTenths = 280;
  let acPowered = false;
  let usbPowered = false;
  let wirelessPowered = false;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    const [k, v] = trimmed.split(':').map((s) => s.trim());
    if (!k || v === undefined) continue;
    if (k === 'level') level = parseInt(v, 10) || 0;
    if (k === 'scale') scale = parseInt(v, 10) || 100;
    if (k === 'status') statusCode = parseInt(v, 10) || 1;
    if (k === 'temperature') tempTenths = parseInt(v, 10) || 280;
    if (k === 'AC powered') acPowered = v === 'true';
    if (k === 'USB powered') usbPowered = v === 'true';
    if (k === 'Wireless powered') wirelessPowered = v === 'true';
  }

  const statusMap: Record<number, string> = {
    1: 'Unknown',
    2: 'Charging',
    3: 'Discharging',
    4: 'Not charging',
    5: 'Full',
  };

  const plugged = acPowered
    ? 'AC'
    : usbPowered
      ? 'USB'
      : wirelessPowered
        ? 'Wireless'
        : 'Unplugged';

  return {
    levelPercent: scale > 0 ? Math.round((level / scale) * 100) : level,
    status: statusMap[statusCode] || 'Unknown',
    temperatureCelsius: Math.round((tempTenths / 10) * 10) / 10,
    plugged,
  };
}

export function parsePmListPackages(
  allOutput: string,
  systemSet: Set<string>,
  disabledSet: Set<string>
): ParsedPackageListItem[] {
  const results: ParsedPackageListItem[] = [];
  const lines = allOutput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (!line.startsWith('package:')) continue;
    const body = line.slice('package:'.length);
    const uidPartMatch = /\s+uid:(\d+)$/.exec(body);
    const uid = uidPartMatch && uidPartMatch[1] ? parseInt(uidPartMatch[1], 10) : undefined;
    const withoutUid = uidPartMatch ? body.slice(0, uidPartMatch.index) : body;
    const lastEq = withoutUid.lastIndexOf('=');

    let apkPath = '';
    let packageName = '';
    if (lastEq > 0) {
      apkPath = withoutUid.slice(0, lastEq);
      packageName = withoutUid.slice(lastEq + 1).trim();
    } else {
      packageName = withoutUid.trim();
    }
    if (!packageName) continue;

    const isSystem =
      systemSet.has(packageName) ||
      apkPath.startsWith('/system/') ||
      apkPath.startsWith('/product/') ||
      apkPath.startsWith('/system_ext/') ||
      apkPath.startsWith('/vendor/') ||
      apkPath.startsWith('/apex/');

    results.push({
      packageName,
      apkPath,
      uid,
      isSystem,
      enabled: !disabledSet.has(packageName),
    });
  }

  return results;
}

export function parseSimplePackageList(raw: string): Set<string> {
  const set = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('package:')) {
      set.add(trimmed.slice('package:'.length).trim());
    }
  }
  return set;
}

export function parseDumpsysPackage(packageName: string, raw: string): ParsedPackageDetails {
  let versionName = '1.0.0';
  let versionCode = 1;
  let firstInstallTime: string | undefined;
  let lastUpdateTime: string | undefined;
  let installerPackageName: string | undefined;
  let sharedUserId: string | undefined;
  let isSystem = false;
  let isUpdatedSystem = false;
  let enabled = true;
  let apkSizeBytes = 14_500_000;
  const apkPaths: string[] = [];
  const requestedPermissions = new Set<string>();
  const grantedPermissions = new Set<string>();

  const lines = raw.split(/\r?\n/);
  let currentSection: 'none' | 'requested' | 'install' | 'runtime' = 'none';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('versionName=')) {
      versionName = trimmed.slice('versionName='.length).trim();
    } else if (trimmed.startsWith('versionCode=')) {
      const vcMatch = /^versionCode=(\d+)/.exec(trimmed);
      if (vcMatch && vcMatch[1]) versionCode = parseInt(vcMatch[1], 10);
    } else if (trimmed.startsWith('firstInstallTime=')) {
      firstInstallTime = trimmed.slice('firstInstallTime='.length).trim();
    } else if (trimmed.startsWith('lastUpdateTime=')) {
      lastUpdateTime = trimmed.slice('lastUpdateTime='.length).trim();
    } else if (trimmed.startsWith('installerPackageName=')) {
      installerPackageName = trimmed.slice('installerPackageName='.length).trim();
    } else if (trimmed.startsWith('sharedUser=') || trimmed.startsWith('sharedUserId=')) {
      const suMatch = /([a-zA-Z0-9_.]+ uid|\bandroid\.uid\.[a-zA-Z0-9_]+)/.exec(trimmed);
      if (suMatch && suMatch[1]) {
        sharedUserId = suMatch[1].replace(/\s+uid$/, '');
      }
    } else if (trimmed.startsWith('codePath=')) {
      const cp = trimmed.slice('codePath='.length).trim();
      if (cp) apkPaths.push(cp.endsWith('.apk') ? cp : `${cp}/base.apk`);
      if (
        cp.startsWith('/system') ||
        cp.startsWith('/product') ||
        cp.startsWith('/system_ext') ||
        cp.startsWith('/vendor')
      ) {
        isSystem = true;
      }
    } else if (trimmed.startsWith('pkgFlags=') || trimmed.startsWith('flags=')) {
      if (trimmed.includes('SYSTEM')) isSystem = true;
      if (trimmed.includes('UPDATED_SYSTEM_APP')) isUpdatedSystem = true;
    } else if (trimmed.startsWith('User 0:')) {
      if (trimmed.includes('enabled=2') || trimmed.includes('enabled=3') || trimmed.includes('enabled=4')) {
        enabled = false;
      }
      if (trimmed.includes('installed=false')) {
        enabled = false;
      }
    } else if (trimmed.startsWith('apkSizeBytes=')) {
      apkSizeBytes = parseInt(trimmed.slice('apkSizeBytes='.length), 10) || apkSizeBytes;
    } else if (trimmed === 'requested permissions:') {
      currentSection = 'requested';
      continue;
    } else if (trimmed === 'install permissions:') {
      currentSection = 'install';
      continue;
    } else if (trimmed.startsWith('runtime permissions:')) {
      currentSection = 'runtime';
      continue;
    } else if (trimmed.endsWith(':') && !trimmed.includes('granted=')) {
      if (currentSection !== 'none' && !trimmed.startsWith('android.permission') && !trimmed.startsWith('com.')) {
        currentSection = 'none';
      }
    }

    if (currentSection === 'requested') {
      const perm = trimmed.split(':')[0]?.trim();
      if (perm && (perm.includes('.permission.') || perm.startsWith('android.permission.'))) {
        requestedPermissions.add(perm);
      }
    } else if (currentSection === 'install' || currentSection === 'runtime') {
      const permMatch = /^([a-zA-Z0-9_.]+\.permission\.[a-zA-Z0-9_]+):\s*granted=(true|false)/.exec(trimmed);
      if (permMatch && permMatch[1] && permMatch[2]) {
        requestedPermissions.add(permMatch[1]);
        if (permMatch[2] === 'true') {
          grantedPermissions.add(permMatch[1]);
        }
      }
    }
  }

  return {
    packageName,
    versionName,
    versionCode,
    firstInstallTime,
    lastUpdateTime,
    installerPackageName,
    sharedUserId,
    isSystem,
    isUpdatedSystem,
    enabled,
    apkPaths: apkPaths.length > 0 ? apkPaths : [`/system/app/${packageName}/base.apk`],
    requestedPermissions: Array.from(requestedPermissions),
    grantedPermissions: Array.from(grantedPermissions),
    apkSizeBytes,
  };
}

export function parseTopProcesses(raw: string): ParsedProcessEntry[] {
  const entries: ParsedProcessEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = /^(\d+)\s+(\S+)\s+(\d+)\s+([\d.]+)\s+(.+)$/.exec(trimmed);
    if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
      entries.push({
        pid: parseInt(match[1], 10),
        user: match[2],
        rssMb: Math.round((parseInt(match[3], 10) / 1024) * 10) / 10,
        cpuPercent: parseFloat(match[4]),
        processName: match[5].trim(),
      });
    }
  }
  return entries;
}
