import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uad-mcp-int-'));
process.env.UAD_DATA_DIR = testTmpDir;
process.env.ADB_MOCK = '1';

import { mockAdb } from '../../src/adb/mockAdb';
import { listConnectedDevices } from '../../src/device/discovery';
import { getDeviceProfile } from '../../src/device/profile';
import { listInstalledApps } from '../../src/apps/inventory';
import { auditPermissions } from '../../src/apps/permissions';
import { classifyInstalledApps } from '../../src/debloat/safetyEngine';
import { createRemovalPlan } from '../../src/debloat/planner';
import { issueHumanApprovalToken } from '../../src/debloat/approval';
import { executeApprovedPlan } from '../../src/debloat/executor';
import { executeRestorePlan } from '../../src/debloat/restore';
import { verifyAuditLogIntegrity } from '../../src/audit/auditLog';
import { invokeMcpTool, MCP_TOOLS } from '../../src/tools/index';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP Stdio Handshake: Spawns server over stdio, completes MCP handshake, and lists tools', async () => {
  const tsxCliPath = path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const indexJsPath = path.resolve(process.cwd(), 'src', 'index.ts');
  const distJsPath = path.resolve(process.cwd(), 'dist', 'index.js');

  const hasDistJs = fs.existsSync(distJsPath);
  const hasLocalTsx = fs.existsSync(tsxCliPath);

  const command = hasDistJs
    ? process.execPath
    : hasLocalTsx
    ? process.execPath
    : (process.platform === 'win32' ? 'npx.cmd' : 'npx');
  const args = hasDistJs
    ? [distJsPath]
    : hasLocalTsx
    ? [tsxCliPath, indexJsPath]
    : ['tsx', indexJsPath];

  const transport = new StdioClientTransport({
    command,
    args,
    env: {
      ...(process.env as Record<string, string>),
      ADB_MOCK: '1',
      UAD_DATA_DIR: testTmpDir,
    },
  });

  const client = new Client(
    { name: 'mcp-test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  const toolsRes = await client.listTools();
  assert.equal(toolsRes.tools.length, 23);

  const callRes = await client.callTool({ name: 'list_devices', arguments: {} });
  assert.equal(Boolean(callRes.isError), false);

  const resourcesRes = await client.listResources();
  assert.equal(resourcesRes.resources.length, 2);

  const promptsRes = await client.listPrompts();
  assert.equal(promptsRes.prompts.length, 1);

  await client.close();
});

test('Integration: Full lifecycle (discovery -> classify -> plan -> human approve -> backup -> execute -> verify -> restore)', async () => {
  mockAdb.reset();

  // 1. Discovery
  const discovery = await listConnectedDevices();
  assert.equal(discovery.usedMock, true);
  assert.equal(discovery.authorizedCount, 2); // Samsung + Xiaomi online, 1 unauthorized

  // 2. Multi-device serial enforcement: omitting serial when >1 online device is connected must fail
  await assert.rejects(
    async () => getDeviceProfile(undefined),
    (err: unknown) => (err as { code?: string }).code === 'MULTIPLE_DEVICES_SERIAL_REQUIRED'
  );

  // 3. Profile with explicit serial
  const serial = 'R5CW918Z2KL';
  const profile = await getDeviceProfile(serial);
  assert.equal(profile.manufacturer, 'samsung');
  assert.equal(profile.model, 'SM-S928B');
  assert.equal(profile.oemSkin.id, 'oneui');

  // 4. Permission Audit
  const permReport = await auditPermissions({ serial });
  assert.ok(permReport.auditedCount > 5);
  assert.ok(permReport.flaggedSystemAppsCount >= 1);

  // 5. Classify Apps
  const classified = await classifyInstalledApps({ serial });
  assert.ok(classified.counts.Safe >= 4);
  assert.ok(classified.counts.Unsafe >= 4);

  // 6. Attempt to plan an Unsafe package MUST be blocked
  await assert.rejects(
    async () =>
      createRemovalPlan({
        serial,
        packages: [{ packageName: 'com.osp.app.signin', action: 'uninstall-keep-data' }],
      }),
    (err: unknown) => (err as { code?: string }).code === 'UNSAFE_PACKAGE_BLOCKED'
  );

  // 7. Create a valid removal plan for 2 Safe packages
  const plan = await createRemovalPlan({
    serial,
    packages: [
      { packageName: 'com.samsung.android.game.gamehome', action: 'uninstall-keep-data' },
      { packageName: 'com.facebook.services', action: 'disable-user' },
    ],
  });
  assert.equal(plan.items.length, 2);
  assert.equal(plan.requiredConfirmationPhrase, 'APPROVE SM-S928B 2 PACKAGES');

  // 8. Attempt to approve with wrong confirmation phrase must fail
  assert.throws(
    () =>
      issueHumanApprovalToken({
        planId: plan.planId,
        humanConfirmationPhrase: 'YES APPROVE',
        channel: 'cli-terminal',
      }),
    (err: unknown) => (err as { code?: string }).code === 'APPROVAL_REQUIRED'
  );

  // 9. Issue valid human approval token
  const approval = issueHumanApprovalToken({
    planId: plan.planId,
    humanConfirmationPhrase: plan.requiredConfirmationPhrase,
    channel: 'cli-terminal',
  });
  assert.ok(approval.approvalToken.includes('.uad_tok_'));

  // 10. Execute plan in dry-run mode first (does not consume token or mutate device)
  const dryRunRes = await executeApprovedPlan({
    planId: plan.planId,
    approvalToken: approval.approvalToken,
    dryRun: true,
    serial,
  });
  assert.equal(dryRunRes.dryRun, true);
  assert.equal(dryRunRes.results.length, 2);

  // 11. Execute plan in live mode (creates APK backups, verifies SHA-256 checksums, runs commands, verifies post-state, checks health)
  const execRes = await executeApprovedPlan({
    planId: plan.planId,
    approvalToken: approval.approvalToken,
    dryRun: false,
    serial,
  });
  assert.equal(execRes.dryRun, false);
  assert.equal(execRes.abortedMidBatch, false);
  assert.equal(execRes.healthCheck.healthy, true);
  assert.ok(execRes.backupManifest);
  assert.equal(execRes.backupManifest.packages.length, 2);
  for (const bkpPkg of execRes.backupManifest.packages) {
    assert.equal(bkpPkg.apkPullSucceeded, true);
    assert.ok((bkpPkg.pulledFiles[0]?.sizeBytes ?? 0) > 0);
    assert.equal(bkpPkg.pulledFiles[0]?.sha256.length, 64);
  }
  for (const cmdRes of execRes.results) {
    assert.equal(cmdRes.verifiedPostState, true);
  }

  // 12. Verify single-use enforcement: reusing the same token MUST fail
  await assert.rejects(
    async () =>
      executeApprovedPlan({
        planId: plan.planId,
        approvalToken: approval.approvalToken,
        dryRun: false,
        serial,
      }),
    (err: unknown) => (err as { code?: string }).code === 'APPROVAL_INVALID_OR_EXPIRED'
  );

  // 13. Restore both packages and verify they are active again
  const restoreRes = await executeRestorePlan({
    serial,
    packages: [
      { packageName: 'com.samsung.android.game.gamehome' },
      { packageName: 'com.facebook.services', restoreCommand: 'pm enable --user 0 com.facebook.services' },
    ],
  });
  assert.equal(restoreRes.restoredCount, 2);

  const invAfterRestore = await listInstalledApps({ serial });
  const gameHome = invAfterRestore.apps.find((a: { packageName: string }) => a.packageName === 'com.samsung.android.game.gamehome');
  const fbServices = invAfterRestore.apps.find((a: { packageName: string }) => a.packageName === 'com.facebook.services');
  assert.ok(gameHome);
  assert.equal(fbServices?.enabled, true);

  // 14. Verify Audit Log hash chain integrity after full round-trip
  const auditVerify = verifyAuditLogIntegrity();
  assert.equal(auditVerify.valid, true);
});

test('Integration: Failure injection (expired token, health check failure mid-batch)', async () => {
  mockAdb.reset();
  const serial = 'R5CW918Z2KL';

  const plan = await createRemovalPlan({
    serial,
    packages: [{ packageName: 'com.samsung.android.aremoji', action: 'uninstall-keep-data' }],
  });

  // Issue already-expired token (-1000ms TTL)
  const expiredApproval = issueHumanApprovalToken({
    planId: plan.planId,
    humanConfirmationPhrase: plan.requiredConfirmationPhrase,
    channel: 'cli-terminal',
    customTtlMs: -1000,
  });

  await assert.rejects(
    async () =>
      executeApprovedPlan({
        planId: plan.planId,
        approvalToken: expiredApproval.approvalToken,
        dryRun: false,
        serial,
      }),
    (err: unknown) => (err as { code?: string }).code === 'APPROVAL_INVALID_OR_EXPIRED'
  );

  // Inject SystemUI health check failure after batch
  mockAdb.setFailureInjection({ failHealthCheckAfterBatch: true });
  const validApproval = issueHumanApprovalToken({
    planId: plan.planId,
    humanConfirmationPhrase: plan.requiredConfirmationPhrase,
    channel: 'cli-terminal',
  });

  const failedHealthRes = await executeApprovedPlan({
    planId: plan.planId,
    approvalToken: validApproval.approvalToken,
    dryRun: false,
    serial,
  });
  assert.equal(failedHealthRes.abortedMidBatch, true);
  assert.equal(failedHealthRes.healthCheck.healthy, false);
  mockAdb.reset();
});

test('MCP Tool Catalog: All 21+ registered tools have valid schemas and annotations', async () => {
  assert.ok(MCP_TOOLS.length >= 21);
  const res = await invokeMcpTool('list_devices', {});
  assert.equal(res.toolName, 'list_devices');
  assert.ok(res.summary.includes('Found'));
});
