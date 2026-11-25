import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolate test data directory before importing modules
const testTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uad-mcp-unit-'));
process.env.UAD_DATA_DIR = testTmpDir;
process.env.ADB_MOCK = '1';

import {
  parseAdbDevicesOutput,
  parseGetPropOutput,
  parseProcMeminfo,
  parseDfOutput,
  parseBatteryOutput,
  parsePmListPackages,
  parseDumpsysPackage,
} from '../../src/adb/parsers';
import { checkProtectedPackage } from '../../src/debloat/protectedPackages';
import { computeSafetyVerdict } from '../../src/debloat/safetyEngine';
import { mergeNormalizedLists } from '../../src/debloat/lists/merge';
import { parseAndValidateMutatingCommand } from '../../src/debloat/executor';
import { assertValidPackageName, assertValidSerial } from '../../src/util/validation';
import { safeResolveUnder } from '../../src/util/paths';
import { appendAuditLog, verifyAuditLogIntegrity } from '../../src/audit/auditLog';
import { detectOemSkin } from '../../src/device/profile';

test('Parsers: parseAdbDevicesOutput parses online, unauthorized, and wireless devices', () => {
  const raw = [
    'List of devices attached',
    'R5CW918Z2KL            device usb:1-1 product:e3qxxx model:SM_S928B device:e3q transport_id:1',
    '9921UNAUTH             unauthorized usb:1-2 transport_id:2',
    '192.168.1.45:39123     device product:houji model:23127PN0CG device:houji transport_id:4',
  ].join('\n');

  const devices = parseAdbDevicesOutput(raw);
  assert.equal(devices.length, 3);
  assert.equal(devices[0]?.serial, 'R5CW918Z2KL');
  assert.equal(devices[0]?.state, 'device');
  assert.equal(devices[0]?.model, 'SM_S928B');
  assert.equal(devices[0]?.isWireless, false);

  assert.equal(devices[1]?.serial, '9921UNAUTH');
  assert.equal(devices[1]?.state, 'unauthorized');

  assert.equal(devices[2]?.serial, '192.168.1.45:39123');
  assert.equal(devices[2]?.isWireless, true);
});

test('Parsers: parseGetPropOutput, parseProcMeminfo, parseDfOutput, parseBatteryOutput, parseDumpsysPackage', () => {
  const props = parseGetPropOutput('[ro.product.manufacturer]: [samsung]\n[ro.build.version.sdk]: [34]');
  assert.equal(props['ro.product.manufacturer'], 'samsung');
  assert.equal(props['ro.build.version.sdk'], '34');

  const mem = parseProcMeminfo(
    'MemTotal: 8192000 kB\nMemFree: 1024000 kB\nMemAvailable: 4096000 kB\nCached: 2048000 kB\nSwapTotal: 2048000 kB\nSwapFree: 1024000 kB'
  );
  assert.equal(mem.totalRamMb, 8000);
  assert.equal(mem.availableRamMb, 4000);
  assert.equal(mem.swapUsedMb, 1000);

  const df = parseDfOutput(
    'Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/block/dm-0 104857600 52428800 52428800 50% /data'
  );
  assert.equal(df.dataPartitionTotalGb, 100);
  assert.equal(df.dataPartitionFreeGb, 50);
  assert.equal(df.dataPartitionUsePercent, 50);

  const bat = parseBatteryOutput('  AC powered: false\n  USB powered: true\n  status: 2\n  level: 85\n  scale: 100\n  temperature: 315');
  assert.equal(bat.levelPercent, 85);
  assert.equal(bat.status, 'Charging');
  assert.equal(bat.temperatureCelsius, 31.5);
  assert.equal(bat.plugged, 'USB');

  const pkgList = parsePmListPackages(
    'package:/system/priv-app/GameHome/GameHome.apk=com.samsung.android.game.gamehome uid:10142',
    new Set(['com.samsung.android.game.gamehome']),
    new Set()
  );
  assert.equal(pkgList.length, 1);
  assert.equal(pkgList[0]?.packageName, 'com.samsung.android.game.gamehome');
  assert.equal(pkgList[0]?.isSystem, true);
  assert.equal(pkgList[0]?.enabled, true);

  const dumpsys = parseDumpsysPackage(
    'com.facebook.services',
    [
      'Packages:',
      '  Package [com.facebook.services] (abc):',
      '    versionCode=85001200 minSdk=28 targetSdk=34',
      '    versionName=85.0.12',
      '    pkgFlags=[ SYSTEM ]',
      '    requested permissions:',
      '      android.permission.ACCESS_FINE_LOCATION',
      '    runtime permissions:',
      '      android.permission.ACCESS_FINE_LOCATION: granted=true',
    ].join('\n')
  );
  assert.equal(dumpsys.versionName, '85.0.12');
  assert.equal(dumpsys.isSystem, true);
  assert.deepEqual(dumpsys.grantedPermissions, ['android.permission.ACCESS_FINE_LOCATION']);
});

test('Safety Engine: Hard-protected packages, prefixes, sharedUserId, roles, and IMEs are always Unsafe', () => {
  const mustBeUnsafe = [
    'android',
    'com.android.systemui',
    'com.android.settings',
    'com.android.phone',
    'com.android.vending',
    'com.google.android.gms',
    'com.osp.app.signin',
    'com.miui.securitycenter',
    'com.xiaomi.finddevice',
    'com.android.providers.telephony',
    'com.android.wifi.resources',
    'com.samsung.android.knox.containercore',
  ];

  for (const pkg of mustBeUnsafe) {
    const check = checkProtectedPackage(pkg);
    assert.equal(check.isProtected, true, `Expected ${pkg} to be hard-protected`);
    const verdict = computeSafetyVerdict({ packageName: pkg, deviceManufacturer: 'samsung' });
    assert.equal(verdict.category, 'Unsafe', `Expected ${pkg} verdict to be Unsafe`);
    assert.equal(verdict.recommendedAction, 'keep-installed');
  }

  // Shared UID protection
  const sharedUidVerdict = computeSafetyVerdict({
    packageName: 'com.custom.vendor.daemon',
    liveContext: { sharedUserId: 'android.uid.system' },
  });
  assert.equal(sharedUidVerdict.category, 'Unsafe');
  assert.ok(sharedUidVerdict.blockedBy?.includes('protected-shared-uid'));

  // Active default Home Launcher role protection
  const roleVerdict = computeSafetyVerdict({
    packageName: 'com.teslacoilsw.launcher',
    liveContext: {
      roleHolders: { 'android.app.role.HOME': ['com.teslacoilsw.launcher'] },
    },
  });
  assert.equal(roleVerdict.category, 'Unsafe');
  assert.ok(roleVerdict.blockedBy?.includes('active-role-holder'));

  // Active IME keyboard protection
  const imeVerdict = computeSafetyVerdict({
    packageName: 'org.futo.inputmethod.latin',
    liveContext: {
      activeInputMethods: ['org.futo.inputmethod.latin/.LatinIME'],
    },
  });
  assert.equal(imeVerdict.category, 'Unsafe');
  assert.ok(imeVerdict.blockedBy?.includes('active-ime'));
});

test('Safety Engine: Unknown packages never classify as Safe (always default to Risky)', () => {
  const unknownPackages = [
    'com.unknown.mystery.app',
    'com.samsung.android.unlisted.internal.service',
    'com.xiaomi.unlisted.feature',
    'org.random.thirdparty.tool',
  ];

  for (const pkg of unknownPackages) {
    const verdict = computeSafetyVerdict({
      packageName: pkg,
      deviceManufacturer: 'samsung',
    });
    assert.notEqual(verdict.category, 'Safe', `Unknown package ${pkg} must never be Safe`);
    assert.equal(verdict.category, 'Risky', `Unknown package ${pkg} must default to Risky`);
  }
});

test('Debloat List Merge: Conflict resolution always chooses the most conservative category', () => {
  const merged = mergeNormalizedLists([
    {
      packageName: 'com.example.conflicted',
      sourceId: 'uad-ng',
      upstreamRating: 'Recommended',
      mappedCategory: 'Safe',
      description: 'UAD says safe',
      oemTags: ['Oem'],
      dependencies: [],
      neededBy: [],
      licenseSpdx: 'GPL-3.0',
    },
    {
      packageName: 'com.example.conflicted',
      sourceId: 'appmanager',
      upstreamRating: 'caution',
      mappedCategory: 'Risky',
      description: 'AppManager says caution',
      oemTags: ['oem'],
      dependencies: [],
      neededBy: [],
      licenseSpdx: 'AGPL-3.0',
    },
  ]);

  const item = merged.get('com.example.conflicted');
  assert.ok(item);
  assert.equal(item.hasConflict, true);
  assert.equal(item.mergedCategory, 'Risky');
  assert.ok(item.conflictExplanation?.includes('resolved to most conservative rating: Risky'));
});

test('Security & Command Policy: Exhaustive allowlist permits only safe user-0 commands and rejects all prohibited commands', () => {
  // Allowed commands
  const valid1 = parseAndValidateMutatingCommand('pm uninstall -k --user 0 com.facebook.services');
  assert.equal(valid1.templateName, 'uninstall-keep-data');
  assert.equal(valid1.packageName, 'com.facebook.services');

  const valid2 = parseAndValidateMutatingCommand('pm disable-user --user 0 com.samsung.android.game.gamehome');
  assert.equal(valid2.templateName, 'disable-user');

  const valid3 = parseAndValidateMutatingCommand('cmd package install-existing --user 0 com.facebook.services');
  assert.equal(valid3.templateName, 'install-existing-cmd');

  const valid4 = parseAndValidateMutatingCommand('pm enable --user 0 com.facebook.services');
  assert.equal(valid4.templateName, 'enable-package');

  // Prohibited commands (Section 7.1)
  const prohibitedCommands = [
    'pm uninstall com.facebook.services', // missing -k and --user 0
    'pm uninstall --user 0 com.facebook.services', // missing -k
    'pm uninstall -k com.facebook.services', // missing --user 0
    'pm clear com.facebook.services',
    'pm hide com.facebook.services',
    'pm suspend com.facebook.services',
    'rm -rf /data/local/tmp',
    'su -c "pm uninstall com.facebook.services"',
    'root',
    'adb shell wipe data',
    'reboot bootloader',
    'reboot recovery',
    'settings put global adb_enabled 0',
    'pm revoke com.facebook.services android.permission.ACCESS_FINE_LOCATION',
    'pm grant com.facebook.services android.permission.READ_LOGS',
    'pm set-install-location 2',
    'fastboot flashing unlock',
    'pm uninstall -k --user 0 com.facebook.services; rm -rf /',
    'pm uninstall -k --user 0 com.facebook.services && id',
    'pm uninstall -k --user 0 android',
  ];

  for (const cmd of prohibitedCommands) {
    assert.throws(
      () => parseAndValidateMutatingCommand(cmd),
      (err: unknown) => (err as { code?: string }).code === 'PROHIBITED_COMMAND' || (err as { code?: string }).code === 'INVALID_PACKAGE_NAME',
      `Prohibited command "${cmd}" must be rejected`
    );
  }
});

test('Security: Rejects command injection in package names, serials, and path traversal in backup paths', () => {
  const maliciousPackages = [
    'com.foo;rm -rf /',
    'com.foo && reboot',
    '$(whoami).pkg',
    '`id`.pkg',
    '../etc/passwd',
    '-f com.foo.bar',
    'singleword',
  ];
  for (const badPkg of maliciousPackages) {
    assert.throws(() => assertValidPackageName(badPkg), /Invalid or unsafe package identifier/);
  }

  const maliciousSerials = [
    '-s evil',
    'R5CW918Z2KL; id',
    'R5CW918Z2KL && ls',
    '../../etc/shadow',
    'serial with spaces',
  ];
  for (const badSerial of maliciousSerials) {
    assert.throws(() => assertValidSerial(badSerial), /Invalid device serial/);
  }

  assert.throws(
    () => safeResolveUnder('/tmp/backups', '../../etc/passwd'),
    /Security violation: target path/
  );
});

test('Audit Log: SHA-256 hash chain detects tampering', () => {
  appendAuditLog({
    eventType: 'TOOL_CALL',
    serial: 'R5CW918Z2KL',
    summary: 'Unit test audit log entry 1',
  });
  appendAuditLog({
    eventType: 'TOOL_CALL',
    serial: 'R5CW918Z2KL',
    summary: 'Unit test audit log entry 2',
  });

  const check1 = verifyAuditLogIntegrity();
  assert.equal(check1.valid, true);
  assert.ok(check1.totalEntries >= 2);
});

test('OEM Skin Detection: Correctly identifies OriginOS vs FuntouchOS on Vivo/iQOO devices', () => {
  const originSkin = detectOemSkin(
    { 'ro.vivo.os.name': 'OriginOS', 'ro.vivo.os.build.display.id': 'OriginOS 4.0' },
    'vivo'
  );
  assert.equal(originSkin.id, 'originos');
  assert.ok(originSkin.displayName.includes('OriginOS'));

  const funtouchSkin = detectOemSkin(
    { 'ro.vivo.os.name': 'FuntouchOS', 'ro.vivo.os.build.display.id': 'Funtouch OS 14' },
    'vivo'
  );
  assert.equal(funtouchSkin.id, 'funtouchos');
  assert.ok(funtouchSkin.displayName.includes('FuntouchOS'));
});
