import fs from 'node:fs';
import path from 'node:path';
import { DebloaterError } from '../util/errors';

export interface MockPackageRecord {
  packageName: string;
  label: string;
  apkPath: string;
  uid: number;
  versionName: string;
  versionCode: number;
  isSystem: boolean;
  isUpdatedSystem: boolean;
  enabled: boolean;
  installedForUser0: boolean;
  installerPackageName: string;
  sharedUserId?: string;
  apkSizeBytes: number;
  requestedPermissions: string[];
  grantedPermissions: string[];
  pullable: boolean;
}

export interface MockDeviceState {
  serial: string;
  state: 'device' | 'unauthorized' | 'offline';
  product: string;
  model: string;
  device: string;
  transportId: string;
  props: Record<string, string>;
  meminfoRaw: string;
  dfRaw: string;
  batteryRaw: string;
  processesRaw: string;
  roles: Record<string, string[]>;
  enabledAccessibilityPackages: string[];
  enabledDeviceAdmins: string[];
  activeInputMethods: string[];
  packages: Map<string, MockPackageRecord>;
  bootCompleted: boolean;
  systemUiResponsive: boolean;
}

export interface FailureInjectionConfig {
  disconnectMidBatchAfterCommands?: number;
  failBackupPullForPackage?: string;
  failHealthCheckAfterBatch?: boolean;
}

function createSamsungPackages(): Map<string, MockPackageRecord> {
  const records: MockPackageRecord[] = [
    {
      packageName: 'android',
      label: 'Android System',
      apkPath: '/system/framework/framework-res.apk',
      uid: 1000,
      versionName: '14',
      versionCode: 34,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 42_100_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.android.systemui',
      label: 'System UI',
      apkPath: '/system_ext/priv-app/SystemUI/SystemUI.apk',
      uid: 10045,
      versionName: '14',
      versionCode: 34,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.systemui',
      apkSizeBytes: 58_400_000,
      requestedPermissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
      grantedPermissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
      pullable: true,
    },
    {
      packageName: 'com.sec.android.app.launcher',
      label: 'One UI Home',
      apkPath: '/system/priv-app/TouchWizHome_2017/TouchWizHome_2017.apk',
      uid: 10082,
      versionName: '15.1.03.65',
      versionCode: 151036500,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.sec.android.preloadinstaller',
      apkSizeBytes: 34_200_000,
      requestedPermissions: ['android.permission.QUERY_ALL_PACKAGES'],
      grantedPermissions: ['android.permission.QUERY_ALL_PACKAGES'],
      pullable: true,
    },
    {
      packageName: 'com.osp.app.signin',
      label: 'Samsung Account',
      apkPath: '/system/priv-app/SamsungAccount/SamsungAccount.apk',
      uid: 10095,
      versionName: '14.5.01.2',
      versionCode: 145010200,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.sec.android.app.samsungapps',
      apkSizeBytes: 48_900_000,
      requestedPermissions: [
        'android.permission.GET_ACCOUNTS',
        'android.permission.READ_PHONE_STATE',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      grantedPermissions: [
        'android.permission.GET_ACCOUNTS',
        'android.permission.READ_PHONE_STATE',
      ],
      pullable: true,
    },
    {
      packageName: 'com.samsung.android.knox.containercore',
      label: 'Knox Enrollment Service',
      apkPath: '/system/priv-app/KnoxCore/KnoxCore.apk',
      uid: 1000,
      versionName: '3.10.0',
      versionCode: 31000000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 19_400_000,
      requestedPermissions: ['android.permission.BIND_DEVICE_ADMIN'],
      grantedPermissions: ['android.permission.BIND_DEVICE_ADMIN'],
      pullable: true,
    },
    {
      packageName: 'com.samsung.android.game.gamehome',
      label: 'Samsung Gaming Hub',
      apkPath: '/system/priv-app/GameHome/GameHome.apk',
      uid: 10142,
      versionName: '7.0.05.11',
      versionCode: 700511000,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.sec.android.app.samsungapps',
      apkSizeBytes: 46_800_000,
      requestedPermissions: [
        'android.permission.PACKAGE_USAGE_STATS',
        'android.permission.READ_PHONE_STATE',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.QUERY_ALL_PACKAGES',
      ],
      grantedPermissions: [
        'android.permission.PACKAGE_USAGE_STATS',
        'android.permission.READ_PHONE_STATE',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.QUERY_ALL_PACKAGES',
      ],
      pullable: true,
    },
    {
      packageName: 'com.samsung.android.app.spage',
      label: 'Samsung Free',
      apkPath: '/system/priv-app/SamsungFree/SamsungFree.apk',
      uid: 10145,
      versionName: '6.0.02.8',
      versionCode: 600208000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 31_250_000,
      requestedPermissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.READ_PHONE_STATE',
        'android.permission.RECORD_AUDIO',
      ],
      grantedPermissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.READ_PHONE_STATE',
      ],
      pullable: true,
    },
    {
      packageName: 'com.samsung.android.aremoji',
      label: 'AR Emoji',
      apkPath: '/system/priv-app/AREmoji/AREmoji.apk',
      uid: 10150,
      versionName: '8.2.00.22',
      versionCode: 820022000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 88_600_000,
      requestedPermissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
      ],
      grantedPermissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
      ],
      pullable: true,
    },
    {
      packageName: 'com.facebook.services',
      label: 'Meta Services',
      apkPath: '/system/app/FBServices/FBServices.apk',
      uid: 10162,
      versionName: '85.0.12',
      versionCode: 85001200,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.sec.android.preloadinstaller',
      apkSizeBytes: 16_400_000,
      requestedPermissions: [
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.READ_PHONE_STATE',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ],
      grantedPermissions: [
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.READ_PHONE_STATE',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ],
      pullable: true,
    },
    {
      packageName: 'com.facebook.appmanager',
      label: 'Meta App Manager',
      apkPath: '/system/priv-app/FBAppManager/FBAppManager.apk',
      uid: 10163,
      versionName: '85.0.12',
      versionCode: 85001200,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.sec.android.preloadinstaller',
      apkSizeBytes: 18_900_000,
      requestedPermissions: [
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.READ_PHONE_STATE',
      ],
      grantedPermissions: [
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.READ_PHONE_STATE',
      ],
      pullable: true,
    },
    {
      packageName: 'com.samsung.android.scloud',
      label: 'Samsung Cloud',
      apkPath: '/system/priv-app/SamsungCloud/SamsungCloud.apk',
      uid: 10170,
      versionName: '5.5.02.14',
      versionCode: 550214000,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.sec.android.app.samsungapps',
      apkSizeBytes: 52_100_000,
      requestedPermissions: [
        'android.permission.READ_CONTACTS',
        'android.permission.READ_SMS',
        'android.permission.READ_CALL_LOG',
        'android.permission.MANAGE_EXTERNAL_STORAGE',
      ],
      grantedPermissions: [
        'android.permission.READ_CONTACTS',
        'android.permission.READ_SMS',
        'android.permission.READ_CALL_LOG',
      ],
      pullable: true,
    },
    {
      packageName: 'com.samsung.android.themestore',
      label: 'Galaxy Themes',
      apkPath: '/system/priv-app/ThemeStore/ThemeStore.apk',
      uid: 10175,
      versionName: '5.4.01.9',
      versionCode: 540109000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 29_300_000,
      requestedPermissions: ['android.permission.READ_PHONE_STATE'],
      grantedPermissions: ['android.permission.READ_PHONE_STATE'],
      pullable: true,
    },
    {
      packageName: 'com.microsoft.appmanager',
      label: 'Link to Windows',
      apkPath: '/system/priv-app/LinkToWindows/LinkToWindows.apk',
      uid: 10185,
      versionName: '1.24032.150.0',
      versionCode: 124032150,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.android.vending',
      apkSizeBytes: 64_700_000,
      requestedPermissions: [
        'android.permission.READ_SMS',
        'android.permission.READ_CALL_LOG',
        'android.permission.READ_CONTACTS',
        'android.permission.RECORD_AUDIO',
        'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
      ],
      grantedPermissions: [
        'android.permission.READ_SMS',
        'android.permission.READ_CALL_LOG',
        'android.permission.READ_CONTACTS',
        'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
      ],
      pullable: true,
    },
    {
      packageName: 'com.samsung.android.internal.diagmonagent',
      label: 'Samsung DiagMonAgent',
      apkPath: '/system/priv-app/DiagMonAgent/DiagMonAgent.apk',
      uid: 10190,
      versionName: '9.1.14',
      versionCode: 911400000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 11_800_000,
      requestedPermissions: ['android.permission.READ_LOGS', 'android.permission.PACKAGE_USAGE_STATS'],
      grantedPermissions: ['android.permission.PACKAGE_USAGE_STATS'],
      pullable: true,
    },
  ];

  return new Map(records.map((r) => [r.packageName, r]));
}

function createXiaomiPackages(): Map<string, MockPackageRecord> {
  const records: MockPackageRecord[] = [
    {
      packageName: 'android',
      label: 'Android System',
      apkPath: '/system/framework/framework-res.apk',
      uid: 1000,
      versionName: '14',
      versionCode: 34,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 40_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.miui.securitycenter',
      label: 'MIUI Security Core',
      apkPath: '/system/priv-app/SecurityCenter/SecurityCenter.apk',
      uid: 1000,
      versionName: '8.7.4-240115',
      versionCode: 40000874,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 74_500_000,
      requestedPermissions: ['android.permission.QUERY_ALL_PACKAGES', 'android.permission.PACKAGE_USAGE_STATS'],
      grantedPermissions: ['android.permission.QUERY_ALL_PACKAGES', 'android.permission.PACKAGE_USAGE_STATS'],
      pullable: true,
    },
    {
      packageName: 'com.xiaomi.finddevice',
      label: 'Xiaomi Find Device',
      apkPath: '/system/priv-app/FindDevice/FindDevice.apk',
      uid: 10068,
      versionName: '15.0.0.1',
      versionCode: 15000001,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 18_200_000,
      requestedPermissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.SEND_SMS'],
      grantedPermissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.SEND_SMS'],
      pullable: true,
    },
    {
      packageName: 'com.miui.msa.global',
      label: 'MSA (MIUI System Ads)',
      apkPath: '/system/app/MSA-Global/MSA-Global.apk',
      uid: 10128,
      versionName: '2024.01.18',
      versionCode: 20240118,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 24_100_000,
      requestedPermissions: [
        'android.permission.READ_PHONE_STATE',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.QUERY_ALL_PACKAGES',
      ],
      grantedPermissions: [
        'android.permission.READ_PHONE_STATE',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.QUERY_ALL_PACKAGES',
      ],
      pullable: true,
    },
    {
      packageName: 'com.miui.analytics',
      label: 'MIUI Analytics Telemetry',
      apkPath: '/system/app/AnalyticsCore/AnalyticsCore.apk',
      uid: 10129,
      versionName: '5.16.0',
      versionCode: 5160000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 15_900_000,
      requestedPermissions: [
        'android.permission.READ_PHONE_STATE',
        'android.permission.PACKAGE_USAGE_STATS',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      grantedPermissions: [
        'android.permission.READ_PHONE_STATE',
        'android.permission.PACKAGE_USAGE_STATS',
      ],
      pullable: true,
    },
    {
      packageName: 'com.xiaomi.mipicks',
      label: 'GetApps Store',
      apkPath: '/system/priv-app/MiPicks/MiPicks.apk',
      uid: 10144,
      versionName: '32.4.1',
      versionCode: 3204010,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 51_400_000,
      requestedPermissions: [
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.READ_PHONE_STATE',
      ],
      grantedPermissions: [
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.READ_PHONE_STATE',
      ],
      pullable: true,
    },
  ];

  return new Map(records.map((r) => [r.packageName, r]));
}

function createGoogleTvPackages(): Map<string, MockPackageRecord> {
  const records: MockPackageRecord[] = [
    {
      packageName: 'android',
      label: 'Android System',
      apkPath: '/system/framework/framework-res.apk',
      uid: 1000,
      versionName: '12',
      versionCode: 31,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 38_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.android.systemui',
      label: 'System UI TV',
      apkPath: '/system_ext/priv-app/SystemUI/SystemUI.apk',
      uid: 10045,
      versionName: '12',
      versionCode: 31,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.systemui',
      apkSizeBytes: 42_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.android.tv.settings',
      label: 'TV Settings',
      apkPath: '/system/priv-app/TvSettings/TvSettings.apk',
      uid: 1000,
      versionName: '12',
      versionCode: 31,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 24_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.google.android.apps.mediashell',
      label: 'Chromecast built-in',
      apkPath: '/system/priv-app/MediaShell/MediaShell.apk',
      uid: 10072,
      versionName: '1.68.374974',
      versionCode: 168374974,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.android.vending',
      apkSizeBytes: 52_000_000,
      requestedPermissions: ['android.permission.INTERNET'],
      grantedPermissions: ['android.permission.INTERNET'],
      pullable: true,
    },
    {
      packageName: 'com.google.android.tv.remote.service',
      label: 'Android TV Remote Service',
      apkPath: '/system/priv-app/AtvRemoteService/AtvRemoteService.apk',
      uid: 10080,
      versionName: '5.2.0',
      versionCode: 5200000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 14_000_000,
      requestedPermissions: ['android.permission.BLUETOOTH_CONNECT'],
      grantedPermissions: ['android.permission.BLUETOOTH_CONNECT'],
      pullable: true,
    },
    {
      packageName: 'com.google.android.apps.tv.launcherx',
      label: 'Google TV Launcher',
      apkPath: '/system/priv-app/LauncherX/LauncherX.apk',
      uid: 10091,
      versionName: '1.0.601',
      versionCode: 10601000,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.android.vending',
      apkSizeBytes: 68_000_000,
      requestedPermissions: ['android.permission.INTERNET', 'android.permission.PACKAGE_USAGE_STATS'],
      grantedPermissions: ['android.permission.INTERNET', 'android.permission.PACKAGE_USAGE_STATS'],
      pullable: true,
    },
    {
      packageName: 'com.google.android.tvrecommendations',
      label: 'Google TV Sponsored Recommendations',
      apkPath: '/system/priv-app/TvRecommendations/TvRecommendations.apk',
      uid: 10092,
      versionName: '1.0.450',
      versionCode: 10450000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 18_500_000,
      requestedPermissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
      grantedPermissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
      pullable: true,
    },
    {
      packageName: 'com.google.android.videos',
      label: 'Google TV Movies Store Feed',
      apkPath: '/system/app/Videos/Videos.apk',
      uid: 10093,
      versionName: '4.38.2',
      versionCode: 4382000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 32_000_000,
      requestedPermissions: ['android.permission.INTERNET'],
      grantedPermissions: ['android.permission.INTERNET'],
      pullable: true,
    },
    {
      packageName: 'com.samba.tv',
      label: 'Samba TV ACR Tracker',
      apkPath: '/vendor/app/SambaTV/SambaTV.apk',
      uid: 10115,
      versionName: '2.1.0',
      versionCode: 21000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 9_200_000,
      requestedPermissions: ['android.permission.INTERNET', 'android.permission.PACKAGE_USAGE_STATS'],
      grantedPermissions: ['android.permission.INTERNET', 'android.permission.PACKAGE_USAGE_STATS'],
      pullable: true,
    },
    {
      packageName: 'com.sony.dtv.recommendations',
      label: 'Sony Bravia Promo Engine',
      apkPath: '/vendor/priv-app/SonyPromo/SonyPromo.apk',
      uid: 10120,
      versionName: '3.0.1',
      versionCode: 300100,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 15_400_000,
      requestedPermissions: ['android.permission.INTERNET'],
      grantedPermissions: ['android.permission.INTERNET'],
      pullable: true,
    },
  ];
  return new Map(records.map((r) => [r.packageName, r]));
}

function createGoogleTvDevice(serial = '192.168.1.120:5555'): MockDeviceState {
  return {
    serial,
    state: 'device',
    product: 'sabrina',
    model: 'Chromecast with Google TV',
    device: 'sabrina',
    transportId: '5',
    bootCompleted: true,
    systemUiResponsive: true,
    props: {
      'ro.product.manufacturer': 'Google',
      'ro.product.brand': 'google',
      'ro.product.model': 'Chromecast with Google TV 4K',
      'ro.product.name': 'sabrina',
      'ro.build.version.release': '12',
      'ro.build.version.sdk': '31',
      'ro.build.version.security_patch': '2026-08-01',
      'ro.build.characteristics': 'tv',
      'ro.build.fingerprint': 'google/sabrina/sabrina:12/STTE.231215.005/11223344:user/release-keys',
      'ro.product.cpu.abi': 'arm64-v8a',
      'sys.boot_completed': '1',
    },
    meminfoRaw: [
      'MemTotal:        1980000 kB',
      'MemFree:          184000 kB',
      'MemAvailable:     620000 kB',
      'Buffers:           48000 kB',
      'Cached:           440000 kB',
      'SwapTotal:       1048576 kB',
      'SwapFree:         512000 kB',
    ].join('\n'),
    dfRaw: [
      'Filesystem       1K-blocks      Used Available Use% Mounted on',
      '/dev/block/dm-5    4400000   3200000   1200000  73% /data',
    ].join('\n'),
    batteryRaw: 'Current Battery Service state:\n  AC powered: true\n  status: 5\n',
    processesRaw: [
      '1200 system 145000 2.1 system_server',
      '1820 u0_a45 110000 2.4 com.android.systemui',
      '2150 u0_a91 180000 4.2 com.google.android.apps.tv.launcherx',
      '2420 u0_a92  98000 2.8 com.google.android.tvrecommendations',
      '2750 u0_a115 62000 1.9 com.samba.tv',
    ].join('\n'),
    roles: {
      'android.app.role.HOME': ['com.google.android.apps.tv.launcherx'],
    },
    enabledAccessibilityPackages: [],
    enabledDeviceAdmins: [],
    activeInputMethods: ['com.google.android.katniss/.search.SearchInputMethodService'],
    packages: createGoogleTvPackages(),
  };
}

function createOriginOsPackages(): Map<string, MockPackageRecord> {
  const records: MockPackageRecord[] = [
    {
      packageName: 'android',
      label: 'Android System',
      apkPath: '/system/framework/framework-res.apk',
      uid: 1000,
      versionName: '14',
      versionCode: 34,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 41_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.android.systemui',
      label: 'System UI',
      apkPath: '/system_ext/priv-app/SystemUI/SystemUI.apk',
      uid: 10045,
      versionName: '14',
      versionCode: 34,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.systemui',
      apkSizeBytes: 48_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.bbk.account',
      label: 'Vivo Account',
      apkPath: '/system/priv-app/VivoAccount/VivoAccount.apk',
      uid: 1000,
      versionName: '9.0.2',
      versionCode: 900200,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 32_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.vivo.permissionmanager',
      label: 'Vivo Permission Controller',
      apkPath: '/system/priv-app/PermissionManager/PermissionManager.apk',
      uid: 1000,
      versionName: '14.0.1',
      versionCode: 1400100,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 21_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.vivo.launcher',
      label: 'OriginOS Atomic Desktop',
      apkPath: '/system/priv-app/VivoLauncher/VivoLauncher.apk',
      uid: 10085,
      versionName: '4.5.12',
      versionCode: 4512000,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.vivo.appstore',
      apkSizeBytes: 58_000_000,
      requestedPermissions: ['android.permission.QUERY_ALL_PACKAGES'],
      grantedPermissions: ['android.permission.QUERY_ALL_PACKAGES'],
      pullable: true,
    },
    {
      packageName: 'com.iqoo.secure',
      label: 'iManager / Security',
      apkPath: '/system/priv-app/iQooSecure/iQooSecure.apk',
      uid: 1000,
      versionName: '8.4.1',
      versionCode: 84100,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 44_000_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.vivo.abe',
      label: 'Abnormal Behavior Engine',
      apkPath: '/system/priv-app/VivoAbe/VivoAbe.apk',
      uid: 1000,
      versionName: '4.2.0',
      versionCode: 42000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      sharedUserId: 'android.uid.system',
      apkSizeBytes: 14_500_000,
      requestedPermissions: [],
      grantedPermissions: [],
      pullable: true,
    },
    {
      packageName: 'com.vivo.weather',
      label: 'Atomic Weather',
      apkPath: '/system/app/VivoWeather/VivoWeather.apk',
      uid: 10110,
      versionName: '14.1.0',
      versionCode: 141000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 28_000_000,
      requestedPermissions: ['android.permission.ACCESS_FINE_LOCATION'],
      grantedPermissions: ['android.permission.ACCESS_FINE_LOCATION'],
      pullable: true,
    },
    {
      packageName: 'com.android.bbklog',
      label: 'BBK Log Diagnostic Service',
      apkPath: '/system/app/BbkLog/BbkLog.apk',
      uid: 10125,
      versionName: '5.1.0',
      versionCode: 51000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 8_200_000,
      requestedPermissions: ['android.permission.READ_LOGS'],
      grantedPermissions: ['android.permission.READ_LOGS'],
      pullable: true,
    },
    {
      packageName: 'com.bbk.iqoo.logsystem',
      label: 'iQOO Diagnostic Logger',
      apkPath: '/system/app/LogSystem/LogSystem.apk',
      uid: 10126,
      versionName: '4.0.2',
      versionCode: 40200,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 11_400_000,
      requestedPermissions: ['android.permission.READ_LOGS'],
      grantedPermissions: ['android.permission.READ_LOGS'],
      pullable: true,
    },
    {
      packageName: 'com.vivo.nps',
      label: 'Vivo User Experience Survey',
      apkPath: '/system/app/VivoNps/VivoNps.apk',
      uid: 10127,
      versionName: '3.6.1',
      versionCode: 36100,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 7_100_000,
      requestedPermissions: ['android.permission.INTERNET'],
      grantedPermissions: ['android.permission.INTERNET'],
      pullable: true,
    },
    {
      packageName: 'com.vivo.epm',
      label: 'Exception Policy Manager',
      apkPath: '/system/app/VivoEpm/VivoEpm.apk',
      uid: 10128,
      versionName: '2.8.0',
      versionCode: 28000,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 9_800_000,
      requestedPermissions: ['android.permission.INTERNET'],
      grantedPermissions: ['android.permission.INTERNET'],
      pullable: true,
    },
    {
      packageName: 'com.vivo.networkimprove',
      label: 'Vivo Network Telemetry',
      apkPath: '/system/app/NetworkImprove/NetworkImprove.apk',
      uid: 10129,
      versionName: '3.1.2',
      versionCode: 31200,
      isSystem: true,
      isUpdatedSystem: false,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'null',
      apkSizeBytes: 6_400_000,
      requestedPermissions: ['android.permission.READ_PHONE_STATE'],
      grantedPermissions: ['android.permission.READ_PHONE_STATE'],
      pullable: true,
    },
    {
      packageName: 'com.vivo.browser',
      label: 'Vivo Browser',
      apkPath: '/system/app/VivoBrowser/VivoBrowser.apk',
      uid: 10140,
      versionName: '18.2.1',
      versionCode: 182100,
      isSystem: true,
      isUpdatedSystem: true,
      enabled: true,
      installedForUser0: true,
      installerPackageName: 'com.vivo.appstore',
      apkSizeBytes: 64_000_000,
      requestedPermissions: ['android.permission.INTERNET'],
      grantedPermissions: ['android.permission.INTERNET'],
      pullable: true,
    },
  ];
  return new Map(records.map((r) => [r.packageName, r]));
}

function createOriginOsDevice(serial = 'vivo_x100_origin'): MockDeviceState {
  return {
    serial,
    state: 'device',
    product: 'PD2309',
    model: 'V2309A',
    device: 'PD2309',
    transportId: '6',
    bootCompleted: true,
    systemUiResponsive: true,
    props: {
      'ro.product.manufacturer': 'vivo',
      'ro.product.brand': 'vivo',
      'ro.product.model': 'V2309A (Vivo X100 Pro)',
      'ro.product.name': 'PD2309',
      'ro.vivo.os.name': 'OriginOS',
      'ro.vivo.os.version': '4.0',
      'ro.vivo.os.build.display.id': 'OriginOS 4.0',
      'ro.build.version.release': '14',
      'ro.build.version.sdk': '34',
      'ro.build.version.security_patch': '2026-10-01',
      'ro.build.fingerprint': 'vivo/PD2309/PD2309:14/UP1A.231005.007/comp-080112:user/release-keys',
      'ro.product.cpu.abi': 'arm64-v8a',
      'sys.boot_completed': '1',
    },
    meminfoRaw: [
      'MemTotal:       16384000 kB',
      'MemFree:         2540000 kB',
      'MemAvailable:    8900000 kB',
      'Buffers:          310000 kB',
      'Cached:          5120000 kB',
      'SwapTotal:       6291456 kB',
      'SwapFree:        5120000 kB',
    ].join('\n'),
    dfRaw: [
      'Filesystem       1K-blocks      Used Available Use% Mounted on',
      '/dev/block/dm-8  512000000 120000000 392000000  24% /data',
    ].join('\n'),
    batteryRaw: 'Current Battery Service state:\n  AC powered: false\n  USB powered: true\n  status: 2\n  level: 94\n',
    processesRaw: [
      '1100 system 380000 3.2 system_server',
      '1940 u0_a45 240000 2.1 com.android.systemui',
      '2300 u0_a85 210000 2.8 com.vivo.launcher',
      '3100 u0_a125  88000 1.9 com.android.bbklog',
      '3420 u0_a126  72000 1.5 com.bbk.iqoo.logsystem',
      '3890 u0_a127  65000 1.2 com.vivo.nps',
    ].join('\n'),
    roles: {
      'android.app.role.HOME': ['com.vivo.launcher'],
    },
    enabledAccessibilityPackages: [],
    enabledDeviceAdmins: [],
    activeInputMethods: ['com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME'],
    packages: createOriginOsPackages(),
  };
}

export class MockAdbEngine {
  private devices: Map<string, MockDeviceState> = new Map();
  private failureConfig: FailureInjectionConfig = {};
  private mutatingCommandsRunInBatch = 0;

  constructor() {
    this.reset();
  }

  public setFailureInjection(config: FailureInjectionConfig): void {
    this.failureConfig = { ...config };
    this.mutatingCommandsRunInBatch = 0;
  }

  public reset(): void {
    this.failureConfig = {};
    this.mutatingCommandsRunInBatch = 0;
    this.devices.clear();

    const samsung: MockDeviceState = {
      serial: 'R5CW918Z2KL',
      state: 'device',
      product: 'e3qxxx',
      model: 'SM_S928B',
      device: 'e3q',
      transportId: '1',
      bootCompleted: true,
      systemUiResponsive: true,
      props: {
        'ro.product.manufacturer': 'samsung',
        'ro.product.brand': 'samsung',
        'ro.product.model': 'SM-S928B',
        'ro.product.name': 'e3qxxx',
        'ro.build.version.release': '14',
        'ro.build.version.sdk': '34',
        'ro.build.version.security_patch': '2026-10-01',
        'ro.build.version.oneui': '60100',
        'ro.build.fingerprint': 'samsung/e3qxxx/e3q:14/UP1A.231005.007/S928BXXS3AXFE:user/release-keys',
        'ro.product.cpu.abi': 'arm64-v8a',
        'sys.boot_completed': '1',
      },
      meminfoRaw: [
        'MemTotal:       11842560 kB',
        'MemFree:         1428400 kB',
        'MemAvailable:    5892100 kB',
        'Buffers:          184320 kB',
        'Cached:          4210680 kB',
        'SwapTotal:       4194300 kB',
        'SwapFree:        2890100 kB',
      ].join('\n'),
      dfRaw: [
        'Filesystem       1K-blocks     Used Available Use% Mounted on',
        '/dev/block/dm-45 245891000 89412000 156479000  37% /data',
      ].join('\n'),
      batteryRaw: [
        'Current Battery Service state:',
        '  AC powered: false',
        '  USB powered: true',
        '  Wireless powered: false',
        '  status: 2',
        '  level: 86',
        '  scale: 100',
        '  temperature: 312',
      ].join('\n'),
      processesRaw: [
        '1420 system 412800 4.2 system_server',
        '1892 u0_a45 298400 2.8 com.android.systemui',
        '2410 u0_a82 215040 1.4 com.sec.android.app.launcher',
        '4122 u0_a142 189440 3.1 com.samsung.android.game.gamehome',
        '4589 u0_a162 142300 1.9 com.facebook.services',
      ].join('\n'),
      roles: {
        'android.app.role.HOME': ['com.sec.android.app.launcher'],
        'android.app.role.DIALER': ['com.samsung.android.dialer'],
        'android.app.role.SMS': ['com.samsung.android.messaging'],
        'android.app.role.BROWSER': ['com.android.chrome'],
      },
      enabledAccessibilityPackages: [],
      enabledDeviceAdmins: ['com.samsung.android.knox.containercore'],
      activeInputMethods: ['com.samsung.android.honeyboard/.service.HoneyBoardService'],
      packages: createSamsungPackages(),
    };

    const xiaomi: MockDeviceState = {
      serial: '8a3f92d1',
      state: 'device',
      product: 'houji',
      model: '23127PN0CG',
      device: 'houji',
      transportId: '2',
      bootCompleted: true,
      systemUiResponsive: true,
      props: {
        'ro.product.manufacturer': 'Xiaomi',
        'ro.product.brand': 'Xiaomi',
        'ro.product.model': '23127PN0CG',
        'ro.product.name': 'houji_global',
        'ro.build.version.release': '14',
        'ro.build.version.sdk': '34',
        'ro.build.version.security_patch': '2026-09-01',
        'ro.miui.ui.version.name': 'V816',
        'ro.mi.os.version.name': 'OS1.0.14.0.UNCMIXM',
        'ro.build.fingerprint': 'Xiaomi/houji_global/houji:14/UKQ1.230804.001/V816.0.14.0.UNCMIXM:user/release-keys',
        'ro.product.cpu.abi': 'arm64-v8a',
        'sys.boot_completed': '1',
      },
      meminfoRaw: [
        'MemTotal:       15924000 kB',
        'MemFree:         2140000 kB',
        'MemAvailable:    7920000 kB',
        'Buffers:          210000 kB',
        'Cached:          5480000 kB',
        'SwapTotal:       6291456 kB',
        'SwapFree:        4820000 kB',
      ].join('\n'),
      dfRaw: [
        'Filesystem       1K-blocks      Used Available Use% Mounted on',
        '/dev/block/dm-12 498210000 142100000 356110000  29% /data',
      ].join('\n'),
      batteryRaw: [
        'Current Battery Service state:',
        '  AC powered: false',
        '  USB powered: true',
        '  Wireless powered: false',
        '  status: 2',
        '  level: 92',
        '  scale: 100',
        '  temperature: 298',
      ].join('\n'),
      processesRaw: [
        '1310 system 445000 3.8 system_server',
        '2190 system 264000 2.5 com.miui.securitycenter',
        '3812 u0_a128 178000 2.9 com.miui.msa.global',
      ].join('\n'),
      roles: {
        'android.app.role.HOME': ['com.miui.home'],
        'android.app.role.DIALER': ['com.google.android.dialer'],
        'android.app.role.SMS': ['com.google.android.apps.messaging'],
      },
      enabledAccessibilityPackages: [],
      enabledDeviceAdmins: [],
      activeInputMethods: ['com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME'],
      packages: createXiaomiPackages(),
    };

    const unauthorizedDevice: MockDeviceState = {
      serial: '9921UNAUTH',
      state: 'unauthorized',
      product: 'husky',
      model: 'Pixel_8_Pro',
      device: 'husky',
      transportId: '3',
      bootCompleted: true,
      systemUiResponsive: true,
      props: {},
      meminfoRaw: '',
      dfRaw: '',
      batteryRaw: '',
      processesRaw: '',
      roles: {},
      enabledAccessibilityPackages: [],
      enabledDeviceAdmins: [],
      activeInputMethods: [],
      packages: new Map(),
    };

    this.devices.set(samsung.serial, samsung);
    this.devices.set(xiaomi.serial, xiaomi);
    this.devices.set(unauthorizedDevice.serial, unauthorizedDevice);
  }

  public getDevice(serial?: string): MockDeviceState {
    if (!serial) {
      const online = Array.from(this.devices.values()).filter((d) => d.state === 'device');
      if (online.length === 0) {
        throw new DebloaterError('NO_DEVICE', 'No authorized Android devices connected.');
      }
      if (online.length > 1) {
        throw new DebloaterError(
          'MULTIPLE_DEVICES_SERIAL_REQUIRED',
          `Multiple devices connected (${online.map((d) => d.serial).join(', ')}). You must specify the "serial" parameter.`
        );
      }
      return online[0]!;
    }

    const dev = this.devices.get(serial);
    if (!dev) {
      throw new DebloaterError('DEVICE_NOT_FOUND', `Device "${serial}" is not connected.`);
    }
    if (dev.state === 'unauthorized') {
      throw new DebloaterError(
        'DEVICE_UNAUTHORIZED',
        `Device "${serial}" is unauthorized. Unlock the phone screen and tap "Allow USB debugging" on the RSA prompt.`
      );
    }
    if (dev.state === 'offline') {
      throw new DebloaterError(
        'DEVICE_OFFLINE',
        `Device "${serial}" is offline. Reconnect the USB cable or re-run wireless adb connect.`
      );
    }
    return dev;
  }

  public execute(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    if (args[0] === 'devices') {
      const lines = ['List of devices attached'];
      for (const dev of this.devices.values()) {
        if (dev.state === 'unauthorized') {
          lines.push(`${dev.serial} unauthorized usb:1-2 transport_id:${dev.transportId}`);
        } else {
          lines.push(
            `${dev.serial} ${dev.state} product:${dev.product} model:${dev.model} device:${dev.device} transport_id:${dev.transportId}`
          );
        }
      }
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    if (args[0] === 'pair' && args[1] && args[2]) {
      return {
        stdout: `Successfully paired to ${args[1]} [guid=adb-wireless-paired]\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (args[0] === 'connect' && args[1]) {
      const serial = args[1];
      if (!this.devices.has(serial)) {
        if (serial.includes('120') || serial.toLowerCase().includes('tv')) {
          this.devices.set(serial, createGoogleTvDevice(serial));
        } else if (serial.toLowerCase().includes('origin') || serial.toLowerCase().includes('vivo')) {
          this.devices.set(serial, createOriginOsDevice(serial));
        } else {
          const base = this.devices.get('R5CW918Z2KL')!;
          this.devices.set(serial, {
            ...base,
            serial,
            transportId: '9',
          });
        }
      }
      return { stdout: `connected to ${serial}\n`, stderr: '', exitCode: 0 };
    }

    if (args[0] === 'disconnect') {
      const target = args[1];
      if (target && this.devices.has(target) && target.includes(':')) {
        this.devices.delete(target);
      }
      return { stdout: `disconnected ${target || 'everything'}\n`, stderr: '', exitCode: 0 };
    }

    let serial: string | undefined;
    let cmdArgs = args;
    if (args[0] === '-s' && args[1]) {
      serial = args[1];
      cmdArgs = args.slice(2);
    }

    const dev = this.getDevice(serial);

    if (cmdArgs[0] === 'pull' && cmdArgs[1] && cmdArgs[2]) {
      const remotePath = cmdArgs[1];
      const localPath = cmdArgs[2];
      const pkgEntry = Array.from(dev.packages.values()).find((p) => p.apkPath === remotePath);
      if (
        (pkgEntry && !pkgEntry.pullable) ||
        (pkgEntry && this.failureConfig.failBackupPullForPackage === pkgEntry.packageName)
      ) {
        return {
          stdout: '',
          stderr: `adb: error: failed to copy '${remotePath}' to '${localPath}': remote Permission denied`,
          exitCode: 1,
        };
      }
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      const deterministicApkPayload = Buffer.from(
        `PK\x03\x04MOCK_ANDROID_APK_ARCHIVE:${dev.serial}:${remotePath}:${pkgEntry?.versionCode ?? 1}`
      );
      fs.writeFileSync(localPath, deterministicApkPayload);
      return {
        stdout: `${remotePath}: 1 file pulled, 0 skipped. 28.4 MB/s (${deterministicApkPayload.length} bytes in 0.001s)\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (cmdArgs[0] !== 'shell') {
      return { stdout: '', stderr: `Unsupported mock command: ${cmdArgs.join(' ')}`, exitCode: 1 };
    }

    const shellArgs = cmdArgs.slice(1);
    const joined = shellArgs.join(' ');

    if (joined === 'getprop') {
      const lines = Object.entries(dev.props).map(([k, v]) => `[${k}]: [${v}]`);
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'getprop sys.boot_completed') {
      return { stdout: dev.bootCompleted ? '1\n' : '0\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'cat /proc/meminfo') {
      return { stdout: dev.meminfoRaw + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'df -k /data' || joined === 'df -k') {
      return { stdout: dev.dfRaw + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'dumpsys battery') {
      return { stdout: dev.batteryRaw + '\n', stderr: '', exitCode: 0 };
    }

    if (joined.startsWith('ps -A')) {
      return { stdout: dev.processesRaw + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'pm list users') {
      return {
        stdout: 'Users:\n\tUserInfo{0:Owner:4c13} running\n\tUserInfo{10:Work profile:1030}\n',
        stderr: '',
        exitCode: 0,
      };
    }

    if (joined === 'pm list packages -f -U --user 0') {
      const lines: string[] = [];
      for (const pkg of dev.packages.values()) {
        if (!pkg.installedForUser0) continue;
        lines.push(`package:${pkg.apkPath}=${pkg.packageName} uid:${pkg.uid}`);
      }
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'pm list packages --user 0') {
      const lines: string[] = [];
      for (const pkg of dev.packages.values()) {
        if (!pkg.installedForUser0) continue;
        lines.push(`package:${pkg.packageName}`);
      }
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'pm list packages -s --user 0') {
      const lines: string[] = [];
      for (const pkg of dev.packages.values()) {
        if (!pkg.installedForUser0 || !pkg.isSystem) continue;
        lines.push(`package:${pkg.packageName}`);
      }
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'pm list packages -d --user 0') {
      const lines: string[] = [];
      for (const pkg of dev.packages.values()) {
        if (!pkg.installedForUser0 || pkg.enabled) continue;
        lines.push(`package:${pkg.packageName}`);
      }
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    if (joined.startsWith('pm path ')) {
      const pkgName = shellArgs[shellArgs.length - 1] ?? '';
      const pkg = dev.packages.get(pkgName);
      if (!pkg) return { stdout: '', stderr: '', exitCode: 1 };
      return { stdout: `package:${pkg.apkPath}\n`, stderr: '', exitCode: 0 };
    }

    if (joined.startsWith('dumpsys package ')) {
      const pkgName = shellArgs[2] ?? '';
      const pkg = dev.packages.get(pkgName);
      if (!pkg) {
        return { stdout: `Unable to find package: ${pkgName}\n`, stderr: '', exitCode: 1 };
      }
      const flags = [pkg.isSystem ? 'SYSTEM' : 'USER', pkg.isUpdatedSystem ? 'UPDATED_SYSTEM_APP' : '']
        .filter(Boolean)
        .join(' ');
      const out = [
        `Packages:`,
        `  Package [${pkg.packageName}] (mock123):`,
        `    userId=${pkg.uid}`,
        pkg.sharedUserId ? `    sharedUser=SharedUserSetting{${pkg.sharedUserId} uid=${pkg.uid}}` : '',
        `    codePath=${pkg.apkPath}`,
        `    versionCode=${pkg.versionCode} minSdk=28 targetSdk=34`,
        `    versionName=${pkg.versionName}`,
        `    pkgFlags=[ ${flags} ]`,
        `    firstInstallTime=2025-01-15 08:00:00`,
        `    lastUpdateTime=2026-09-12 14:22:10`,
        `    installerPackageName=${pkg.installerPackageName}`,
        `    apkSizeBytes=${pkg.apkSizeBytes}`,
        `    User 0: installed=${pkg.installedForUser0} hidden=false suspended=false stopped=false notLaunched=false enabled=${pkg.enabled ? 1 : 3}`,
        `    requested permissions:`,
        ...pkg.requestedPermissions.map((p) => `      ${p}`),
        `    runtime permissions:`,
        ...pkg.requestedPermissions.map(
          (p) => `      ${p}: granted=${pkg.grantedPermissions.includes(p) ? 'true' : 'false'}`
        ),
      ]
        .filter(Boolean)
        .join('\n');
      return { stdout: out + '\n', stderr: '', exitCode: 0 };
    }

    if (joined.startsWith('cmd role get-role-holders ')) {
      const role = shellArgs[3] ?? '';
      const holders = dev.roles[role] ?? [];
      return { stdout: holders.join(';') + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'ime list -a -s' || joined === 'ime list -a') {
      return { stdout: dev.activeInputMethods.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    if (joined === 'settings get secure enabled_accessibility_services') {
      return {
        stdout: (dev.enabledAccessibilityPackages.join(':') || 'null') + '\n',
        stderr: '',
        exitCode: 0,
      };
    }

    if (joined === 'dumpsys activity services com.android.systemui') {
      if (!dev.systemUiResponsive || this.failureConfig.failHealthCheckAfterBatch) {
        return { stdout: '(nothing)\n', stderr: '', exitCode: 1 };
      }
      return {
        stdout: 'ServiceRecord{u0 com.android.systemui/.SystemUIService}\n',
        stderr: '',
        exitCode: 0,
      };
    }

    if (joined.startsWith('pm uninstall -k --user 0 ')) {
      this.mutatingCommandsRunInBatch++;
      if (
        this.failureConfig.disconnectMidBatchAfterCommands &&
        this.mutatingCommandsRunInBatch >= this.failureConfig.disconnectMidBatchAfterCommands
      ) {
        dev.state = 'offline';
        throw new DebloaterError('DEVICE_OFFLINE', `Device "${dev.serial}" disconnected mid-batch.`);
      }
      const pkgName = shellArgs[shellArgs.length - 1] ?? '';
      const pkg = dev.packages.get(pkgName);
      if (!pkg || !pkg.installedForUser0) {
        return { stdout: 'Failure [not installed for 0]\n', stderr: '', exitCode: 1 };
      }
      pkg.installedForUser0 = false;
      // Reflect freed RAM in meminfo
      dev.meminfoRaw = dev.meminfoRaw.replace('MemAvailable:    5892100 kB', 'MemAvailable:    6148200 kB');
      return { stdout: 'Success\n', stderr: '', exitCode: 0 };
    }

    if (joined.startsWith('pm disable-user --user 0 ')) {
      this.mutatingCommandsRunInBatch++;
      const pkgName = shellArgs[shellArgs.length - 1] ?? '';
      const pkg = dev.packages.get(pkgName);
      if (!pkg || !pkg.installedForUser0) {
        return { stdout: `Failure [unknown package: ${pkgName}]\n`, stderr: '', exitCode: 1 };
      }
      pkg.enabled = false;
      return {
        stdout: `Package ${pkgName} new state: disabled-user\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (
      joined.startsWith('cmd package install-existing --user 0 ') ||
      joined.startsWith('pm install-existing --user 0 ')
    ) {
      const pkgName = shellArgs[shellArgs.length - 1] ?? '';
      const pkg = dev.packages.get(pkgName);
      if (!pkg) {
        return { stdout: `Package ${pkgName} doesn't exist\n`, stderr: '', exitCode: 1 };
      }
      pkg.installedForUser0 = true;
      pkg.enabled = true;
      return {
        stdout: `Package ${pkgName} installed for user: 0\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (joined.startsWith('pm enable --user 0 ')) {
      const pkgName = shellArgs[shellArgs.length - 1] ?? '';
      const pkg = dev.packages.get(pkgName);
      if (!pkg) {
        return { stdout: `Failure [unknown package: ${pkgName}]\n`, stderr: '', exitCode: 1 };
      }
      pkg.enabled = true;
      return {
        stdout: `Package ${pkgName} new state: enabled\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    return { stdout: '', stderr: '', exitCode: 0 };
  }
}

export const mockAdb = new MockAdbEngine();
