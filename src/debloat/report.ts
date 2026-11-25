import fs from 'node:fs';
import path from 'node:path';
import { getDeviceResourceUsage, DeviceResourceSnapshot } from '../device/resources';
import { listInstalledApps } from '../apps/inventory';
import { getSubDir, safeResolveUnder } from '../util/paths';

export interface PerformanceReport {
  reportId: string;
  generatedAt: string;
  serial: string;
  sampleCount: number;
  baseline: {
    availableRamMbAvg: number;
    freeRamMbAvg: number;
    swapUsedMbAvg: number;
    dataUsedGb: number;
    dataFreeGb: number;
    processCount: number;
    enabledPackagesCount: number;
  };
  after: {
    availableRamMbAvg: number;
    freeRamMbAvg: number;
    swapUsedMbAvg: number;
    dataUsedGb: number;
    dataFreeGb: number;
    processCount: number;
    enabledPackagesCount: number;
  };
  deltas: {
    availableRamMbDelta: number;
    swapUsedMbDelta: number;
    dataFreeGbDelta: number;
    processCountDelta: number;
    enabledPackagesDelta: number;
  };
  statisticalMethodologyNote: string;
  packagesChanged: string[];
  markdownReport: string;
  savedJsonPath: string;
  savedMarkdownPath: string;
}

export async function generateBeforeAfterReport(params: {
  serial?: string;
  baselineSnapshot?: DeviceResourceSnapshot;
  baselineEnabledCount?: number;
  packagesChanged?: string[];
  sampleCount?: number;
}): Promise<PerformanceReport> {
  const sampleCount = Math.min(5, Math.max(1, params.sampleCount ?? 3));
  const samples: DeviceResourceSnapshot[] = [];

  for (let i = 0; i < sampleCount; i++) {
    samples.push(await getDeviceResourceUsage(params.serial));
  }

  const latest = samples[samples.length - 1]!;
  const inventory = await listInstalledApps({ serial: latest.serial });
  const currentEnabledCount = inventory.apps.filter((a) => a.enabled).length;

  const avg = (nums: number[]) =>
    Math.round((nums.reduce((acc, v) => acc + v, 0) / Math.max(1, nums.length)) * 10) / 10;

  const afterAvailRam = avg(samples.map((s) => s.memory.availableRamMb));
  const afterFreeRam = avg(samples.map((s) => s.memory.freeRamMb));
  const afterSwapUsed = avg(samples.map((s) => s.memory.swapUsedMb));

  const baseSnap = params.baselineSnapshot || samples[0]!;
  const baseAvailRam = baseSnap.memory.availableRamMb;
  const baseFreeRam = baseSnap.memory.freeRamMb;
  const baseSwapUsed = baseSnap.memory.swapUsedMb;
  const baseEnabledCount = params.baselineEnabledCount ?? currentEnabledCount;

  const availableRamMbDelta = Math.round((afterAvailRam - baseAvailRam) * 10) / 10;
  const swapUsedMbDelta = Math.round((afterSwapUsed - baseSwapUsed) * 10) / 10;
  const dataFreeGbDelta =
    Math.round((latest.storage.dataPartitionFreeGb - baseSnap.storage.dataPartitionFreeGb) * 100) / 100;
  const processCountDelta = latest.processCount - baseSnap.processCount;
  const enabledPackagesDelta = currentEnabledCount - baseEnabledCount;

  const reportId = `rep_${Date.now()}`;
  const generatedAt = new Date().toISOString();
  const statisticalMethodologyNote = `Averaged across ${sampleCount} resource samples. Note: Android Linux kernel memory management actively uses free RAM for page cache; memory readings fluctuate naturally and debloating user-0 packages primarily reduces background wakeups and RAM pressure rather than shrinking read-only /system partition size.`;

  const packagesChanged = params.packagesChanged || [];

  const mdLines = [
    `# Android Debloat Resource & Telemetry Report (${reportId})`,
    ``,
    `- **Device Serial**: \`${latest.serial}\``,
    `- **Generated At**: \`${generatedAt}\``,
    `- **Samples Captured**: \`${sampleCount}\``,
    ``,
    `## 1. Before / After Resource Comparison`,
    ``,
    `| Metric | Baseline | After (${sampleCount}-Sample Avg) | Measured Delta |`,
    `| :--- | ---: | ---: | ---: |`,
    `| Available RAM (MB) | ${baseAvailRam.toFixed(1)} MB | ${afterAvailRam.toFixed(1)} MB | ${availableRamMbDelta >= 0 ? '+' : ''}${availableRamMbDelta.toFixed(1)} MB |`,
    `| Free RAM (MB) | ${baseFreeRam.toFixed(1)} MB | ${afterFreeRam.toFixed(1)} MB | ${(afterFreeRam - baseFreeRam >= 0 ? '+' : '')}${(afterFreeRam - baseFreeRam).toFixed(1)} MB |`,
    `| Swap Used (MB) | ${baseSwapUsed.toFixed(1)} MB | ${afterSwapUsed.toFixed(1)} MB | ${swapUsedMbDelta >= 0 ? '+' : ''}${swapUsedMbDelta.toFixed(1)} MB |`,
    `| /data Free Storage (GB) | ${baseSnap.storage.dataPartitionFreeGb.toFixed(2)} GB | ${latest.storage.dataPartitionFreeGb.toFixed(2)} GB | ${dataFreeGbDelta >= 0 ? '+' : ''}${dataFreeGbDelta.toFixed(2)} GB |`,
    `| Running Processes | ${baseSnap.processCount} | ${latest.processCount} | ${processCountDelta >= 0 ? '+' : ''}${processCountDelta} |`,
    `| Enabled Packages (User 0) | ${baseEnabledCount} | ${currentEnabledCount} | ${enabledPackagesDelta >= 0 ? '+' : ''}${enabledPackagesDelta} |`,
    ``,
    `## 2. Packages Modified`,
    packagesChanged.length > 0
      ? packagesChanged.map((p) => `- \`${p}\``).join('\n')
      : `- None (Baseline / Read-only telemetry capture)`,
    ``,
    `## 3. Statistical Honesty & Caveats`,
    `${statisticalMethodologyNote}`,
    ``,
  ];

  const markdownReport = mdLines.join('\n');
  const reportsDir = getSubDir('reports');
  const savedJsonPath = safeResolveUnder(reportsDir, `${reportId}.json`);
  const savedMarkdownPath = safeResolveUnder(reportsDir, `${reportId}.md`);

  const reportObj: PerformanceReport = {
    reportId,
    generatedAt,
    serial: latest.serial,
    sampleCount,
    baseline: {
      availableRamMbAvg: baseAvailRam,
      freeRamMbAvg: baseFreeRam,
      swapUsedMbAvg: baseSwapUsed,
      dataUsedGb: baseSnap.storage.dataPartitionUsedGb,
      dataFreeGb: baseSnap.storage.dataPartitionFreeGb,
      processCount: baseSnap.processCount,
      enabledPackagesCount: baseEnabledCount,
    },
    after: {
      availableRamMbAvg: afterAvailRam,
      freeRamMbAvg: afterFreeRam,
      swapUsedMbAvg: afterSwapUsed,
      dataUsedGb: latest.storage.dataPartitionUsedGb,
      dataFreeGb: latest.storage.dataPartitionFreeGb,
      processCount: latest.processCount,
      enabledPackagesCount: currentEnabledCount,
    },
    deltas: {
      availableRamMbDelta,
      swapUsedMbDelta,
      dataFreeGbDelta,
      processCountDelta,
      enabledPackagesDelta,
    },
    statisticalMethodologyNote,
    packagesChanged,
    markdownReport,
    savedJsonPath,
    savedMarkdownPath,
  };

  fs.writeFileSync(savedJsonPath, JSON.stringify(reportObj, null, 2), 'utf8');
  fs.writeFileSync(savedMarkdownPath, markdownReport, 'utf8');

  return reportObj;
}
