import { adbClient } from '../adb/adbClient';
import { parsePmListPackages, parseSimplePackageList, ParsedPackageListItem } from '../adb/parsers';

export interface InstalledAppSummary extends ParsedPackageListItem {
  label: string;
}

export interface AppInventoryResult {
  serial: string;
  targetUser: 0;
  detectedDeviceUsers: Array<{ userId: number; name: string }>;
  totalPackages: number;
  systemPackagesCount: number;
  thirdPartyPackagesCount: number;
  disabledPackagesCount: number;
  apps: InstalledAppSummary[];
  usedMock: boolean;
}

const KNOWN_LABELS: Record<string, string> = {
  android: 'Android Framework Core',
  'com.android.systemui': 'System UI',
  'com.sec.android.app.launcher': 'One UI Home',
  'com.osp.app.signin': 'Samsung Account',
  'com.samsung.android.knox.containercore': 'Knox Enrollment Service',
  'com.samsung.android.game.gamehome': 'Samsung Gaming Hub',
  'com.samsung.android.app.spage': 'Samsung Free',
  'com.samsung.android.aremoji': 'AR Emoji',
  'com.facebook.services': 'Meta Services',
  'com.facebook.appmanager': 'Meta App Manager',
  'com.samsung.android.scloud': 'Samsung Cloud',
  'com.samsung.android.themestore': 'Galaxy Themes',
  'com.microsoft.appmanager': 'Link to Windows',
  'com.samsung.android.internal.diagmonagent': 'Samsung DiagMonAgent',
  'com.miui.securitycenter': 'MIUI Security Core',
  'com.xiaomi.finddevice': 'Xiaomi Find Device',
  'com.miui.msa.global': 'MSA (MIUI System Ads)',
  'com.miui.analytics': 'MIUI Analytics Telemetry',
  'com.xiaomi.mipicks': 'Xiaomi GetApps Store',
};

export function inferHumanLabel(packageName: string): string {
  if (KNOWN_LABELS[packageName]) return KNOWN_LABELS[packageName]!;
  const segments = packageName.split('.');
  const last = segments[segments.length - 1] || packageName;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export async function listInstalledApps(options?: {
  serial?: string;
  filter?: 'all' | 'system' | 'third-party' | 'enabled' | 'disabled';
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AppInventoryResult> {
  const targetSerial = await adbClient.resolveTargetSerial(options?.serial);

  const [allRes, sysRes, disRes, usersRes] = await Promise.all([
    adbClient.runShell(targetSerial, ['pm', 'list', 'packages', '-f', '-U', '--user', '0']),
    adbClient.runShell(targetSerial, ['pm', 'list', 'packages', '-s', '--user', '0']),
    adbClient.runShell(targetSerial, ['pm', 'list', 'packages', '-d', '--user', '0']),
    adbClient.runShell(targetSerial, ['pm', 'list', 'users']),
  ]);

  const systemSet = parseSimplePackageList(sysRes.result.stdout);
  const disabledSet = parseSimplePackageList(disRes.result.stdout);
  const parsed = parsePmListPackages(allRes.result.stdout, systemSet, disabledSet);

  const detectedDeviceUsers: Array<{ userId: number; name: string }> = [];
  for (const line of usersRes.result.stdout.split(/\r?\n/)) {
    const m = /UserInfo\{(\d+):([^:}]+):/.exec(line);
    if (m && m[1] && m[2]) {
      detectedDeviceUsers.push({ userId: parseInt(m[1], 10), name: m[2] });
    }
  }
  if (detectedDeviceUsers.length === 0) {
    detectedDeviceUsers.push({ userId: 0, name: 'Owner' });
  }

  let enriched: InstalledAppSummary[] = parsed.map((item) => ({
    ...item,
    label: inferHumanLabel(item.packageName),
  }));

  const totalPackages = enriched.length;
  const systemPackagesCount = enriched.filter((a) => a.isSystem).length;
  const thirdPartyPackagesCount = totalPackages - systemPackagesCount;
  const disabledPackagesCount = enriched.filter((a) => !a.enabled).length;

  const filter = options?.filter || 'all';
  if (filter === 'system') enriched = enriched.filter((a) => a.isSystem);
  if (filter === 'third-party') enriched = enriched.filter((a) => !a.isSystem);
  if (filter === 'enabled') enriched = enriched.filter((a) => a.enabled);
  if (filter === 'disabled') enriched = enriched.filter((a) => !a.enabled);

  if (options?.search) {
    const q = options.search.toLowerCase();
    enriched = enriched.filter(
      (a) => a.packageName.toLowerCase().includes(q) || a.label.toLowerCase().includes(q)
    );
  }

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 200;
  const paginated = enriched.slice(offset, offset + limit);

  return {
    serial: targetSerial,
    targetUser: 0,
    detectedDeviceUsers,
    totalPackages,
    systemPackagesCount,
    thirdPartyPackagesCount,
    disabledPackagesCount,
    apps: paginated,
    usedMock: allRes.result.usedMock,
  };
}
