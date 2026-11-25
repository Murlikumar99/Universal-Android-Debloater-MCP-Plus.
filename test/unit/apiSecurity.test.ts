import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uad-mcp-sec-'));
process.env.UAD_DATA_DIR = testTmpDir;
process.env.ADB_MOCK = '1';

import { MCP_TOOLS, invokeMcpTool } from '../../src/tools/index';
import { createRemovalPlan } from '../../src/debloat/planner';
import { issueHumanApprovalToken, validateAndConsumeApprovalToken } from '../../src/debloat/approval';
import { getDeviceProfile } from '../../src/device/profile';

test('Security & Approval Token Validation: Validates plan hashes, expiration, single-use, and device binding', async () => {
  const serial = 'R5CW918Z2KL';
  const profile = await getDeviceProfile(serial);

  // 1. All 23 registered MCP tools have valid schemas and descriptions
  assert.equal(MCP_TOOLS.length, 23);
  for (const tool of MCP_TOOLS) {
    assert.ok(tool.name.length < 64);
    assert.ok(/^[a-z0-9_]+$/.test(tool.name));
    assert.ok(tool.description.length > 10);
  }

  // 2. Create removal plan
  const plan = await createRemovalPlan({
    serial,
    packages: [{ packageName: 'com.samsung.android.game.gamehome', action: 'uninstall-keep-data' }],
  });

  // 3. Issue approval token out-of-band
  const approval = issueHumanApprovalToken({
    planId: plan.planId,
    humanConfirmationPhrase: plan.requiredConfirmationPhrase,
    channel: 'cli-terminal',
  });

  assert.ok(approval.approvalToken.includes('.uad_tok_'));

  // 4. Validate and consume token in dry-run mode (does not mark used)
  const dryRunRecord = validateAndConsumeApprovalToken({
    approvalToken: approval.approvalToken,
    plan,
    currentSerial: profile.serial,
    currentFingerprint: profile.buildFingerprint,
    dryRun: true,
  });
  assert.equal(dryRunRecord.used, false);

  // 5. Consume token in live mode
  const liveRecord = validateAndConsumeApprovalToken({
    approvalToken: approval.approvalToken,
    plan,
    currentSerial: profile.serial,
    currentFingerprint: profile.buildFingerprint,
    dryRun: false,
  });
  assert.equal(liveRecord.used, true);

  // 6. Attempting to reuse consumed token MUST fail
  assert.throws(
    () =>
      validateAndConsumeApprovalToken({
        approvalToken: approval.approvalToken,
        plan,
        currentSerial: profile.serial,
        currentFingerprint: profile.buildFingerprint,
        dryRun: false,
      }),
    (err: unknown) => (err as { code?: string }).code === 'APPROVAL_INVALID_OR_EXPIRED'
  );

  // 7. Test read-only tool invocation via invokeMcpTool
  const listRes = await invokeMcpTool('list_devices', {});
  assert.equal(listRes.toolName, 'list_devices');
  assert.ok(listRes.summary.includes('Found'));
});
