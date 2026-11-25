import { adbClient } from '../adb/adbClient';
import { parseDumpsysPackage, ParsedPackageDetails } from '../adb/parsers';
import { inferHumanLabel } from './inventory';
import { assertValidPackageName } from '../util/validation';
import { DebloaterError } from '../util/errors';

export interface DetailedAppInfo extends ParsedPackageDetails {
  serial: string;
  label: string;
  usedMock: boolean;
}

export async function getAppDetails(packageName: string, serial?: string): Promise<DetailedAppInfo> {
  assertValidPackageName(packageName, true);
  const targetSerial = await adbClient.resolveTargetSerial(serial);
  const { result } = await adbClient.runShell(targetSerial, ['dumpsys', 'package', packageName]);

  if (result.exitCode !== 0 || result.stdout.includes('Unable to find package')) {
    throw new DebloaterError(
      'COMMAND_FAILED',
      `Package "${packageName}" is not installed on device "${targetSerial}".`
    );
  }

  const parsed = parseDumpsysPackage(packageName, result.stdout);
  return {
    ...parsed,
    serial: targetSerial,
    label: inferHumanLabel(packageName),
    usedMock: result.usedMock,
  };
}
