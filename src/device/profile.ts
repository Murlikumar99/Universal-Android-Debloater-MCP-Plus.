import { adbClient } from '../adb/adbClient';
import { parseGetPropOutput } from '../adb/parsers';

export interface DeviceProfile {
  serial: string;
  manufacturer: string;
  brand: string;
  model: string;
  deviceName: string;
  androidVersion: string;
  sdkInt: number;
  securityPatch: string;
  buildFingerprint: string;
  cpuAbi: string;
  formFactor: 'phone' | 'tablet' | 'tv';
  oemSkin: {
    id: 'oneui' | 'hyperos' | 'miui' | 'coloros' | 'realmeui' | 'oxygenos' | 'originos' | 'funtouchos' | 'funtouch_origin' | 'aosp' | 'googletv' | 'androidtv' | 'firetv' | 'patchwall';
    displayName: string;
    version?: string;
  };
  usedMock: boolean;
}

export function detectFormFactor(props: Record<string, string>): 'phone' | 'tablet' | 'tv' {
  const chars = (props['ro.build.characteristics'] || '').toLowerCase();
  const model = (props['ro.product.model'] || '').toLowerCase();
  const name = (props['ro.product.name'] || '').toLowerCase();
  if (chars.includes('tv') || model.includes('tv') || model.includes('bravia') || model.includes('shield') || model.includes('chromecast') || name.includes('sabrina') || name.includes('boreal') || props['ro.build.version.fireos']) {
    return 'tv';
  }
  if (chars.includes('tablet') || model.includes('tab') || chars.includes('pad')) {
    return 'tablet';
  }
  return 'phone';
}

export function detectOemSkin(props: Record<string, string>, manufacturer: string): DeviceProfile['oemSkin'] {
  const mfg = manufacturer.toLowerCase();
  const chars = (props['ro.build.characteristics'] || '').toLowerCase();
  const isTv = chars.includes('tv') || (props['ro.product.model'] || '').toLowerCase().includes('tv');

  if (props['ro.build.version.fireos'] || mfg === 'amazon') {
    return {
      id: 'firetv',
      displayName: `Amazon Fire TV (${props['ro.build.version.fireos'] || 'Fire OS'})`,
      version: props['ro.build.version.fireos'],
    };
  }

  if (props['ro.mitv.ui.version.name'] || (isTv && ['xiaomi', 'redmi'].includes(mfg))) {
    return {
      id: 'patchwall',
      displayName: `Xiaomi PatchWall TV (${props['ro.mitv.ui.version.name'] || 'PatchWall'})`,
      version: props['ro.mitv.ui.version.name'],
    };
  }

  if (isTv || chars.includes('tv') || (props['ro.product.name'] || '').includes('sabrina') || (props['ro.product.name'] || '').includes('boreal')) {
    const isGoogleTv = props['ro.product.model']?.toLowerCase().includes('google tv') || props['ro.product.name']?.toLowerCase().includes('sabrina') || props['ro.product.name']?.toLowerCase().includes('boreal') || props['ro.vendor.product.device']?.toLowerCase().includes('googletv');
    return {
      id: isGoogleTv ? 'googletv' : 'androidtv',
      displayName: isGoogleTv ? 'Google TV' : 'Android TV',
      version: props['ro.build.version.release'],
    };
  }

  if (props['ro.build.version.oneui'] || props['ro.build.version.sep'] || mfg === 'samsung') {
    const rawVer = props['ro.build.version.oneui'];
    let formattedVer = rawVer;
    if (rawVer && /^\d{5}$/.test(rawVer)) {
      const major = parseInt(rawVer.slice(0, 1), 10);
      const minor = parseInt(rawVer.slice(1, 3), 10);
      formattedVer = `${major}.${minor}`;
    }
    return {
      id: 'oneui',
      displayName: formattedVer ? `Samsung One UI ${formattedVer}` : 'Samsung One UI',
      version: formattedVer,
    };
  }

  if (props['ro.mi.os.version.name']) {
    return {
      id: 'hyperos',
      displayName: `Xiaomi HyperOS (${props['ro.mi.os.version.name']})`,
      version: props['ro.mi.os.version.name'],
    };
  }

  if (props['ro.miui.ui.version.name'] || ['xiaomi', 'redmi', 'poco'].includes(mfg)) {
    return {
      id: 'miui',
      displayName: `Xiaomi MIUI (${props['ro.miui.ui.version.name'] || 'Global'})`,
      version: props['ro.miui.ui.version.name'],
    };
  }

  if (props['ro.build.version.realmeui'] || mfg === 'realme') {
    return {
      id: 'realmeui',
      displayName: `Realme UI ${props['ro.build.version.realmeui'] || ''}`.trim(),
      version: props['ro.build.version.realmeui'],
    };
  }

  if (props['ro.oxygen.version'] || mfg === 'oneplus') {
    return {
      id: 'oxygenos',
      displayName: `OxygenOS ${props['ro.oxygen.version'] || ''}`.trim(),
      version: props['ro.oxygen.version'],
    };
  }

  if (props['ro.build.version.opporom'] || props['ro.build.version.oplusrom'] || mfg === 'oppo') {
    const ver = props['ro.build.version.opporom'] || props['ro.build.version.oplusrom'];
    return {
      id: 'coloros',
      displayName: `ColorOS ${ver || ''}`.trim(),
      version: ver,
    };
  }

  const vivoOsName = (props['ro.vivo.os.name'] || '').toLowerCase();
  const vivoDisplayId = (props['ro.vivo.os.build.display.id'] || '').toLowerCase();
  const vivoVersion = (props['ro.vivo.os.version'] || '').toLowerCase();
  const isOriginOs = vivoOsName.includes('origin') || vivoDisplayId.includes('origin') || vivoVersion.includes('origin');

  if (isOriginOs) {
    const ver = props['ro.vivo.os.build.display.id'] || props['ro.vivo.os.version'] || props['ro.vivo.os.name'] || 'OriginOS';
    return {
      id: 'originos',
      displayName: `Vivo OriginOS (${ver})`,
      version: ver,
    };
  }

  if (props['ro.vivo.os.build.display.id'] || props['ro.vivo.os.name'] || ['vivo', 'iqoo'].includes(mfg)) {
    const ver = props['ro.vivo.os.build.display.id'] || props['ro.vivo.os.name'] || 'FuntouchOS';
    return {
      id: 'funtouchos',
      displayName: `Vivo FuntouchOS (${ver})`,
      version: ver,
    };
  }

  return {
    id: 'aosp',
    displayName: 'Pixel / AOSP',
  };
}

export async function getDeviceProfile(serial?: string): Promise<DeviceProfile> {
  const { serial: resolvedSerial, result } = await adbClient.runShell(serial, ['getprop']);
  const props = parseGetPropOutput(result.stdout);

  const manufacturer = props['ro.product.manufacturer'] || 'Unknown';
  const brand = props['ro.product.brand'] || manufacturer;
  const model = props['ro.product.model'] || 'Android Device';
  const deviceName = props['ro.product.name'] || props['ro.product.device'] || 'generic';
  const androidVersion = props['ro.build.version.release'] || '14';
  const sdkInt = parseInt(props['ro.build.version.sdk'] || '34', 10) || 34;
  const securityPatch = props['ro.build.version.security_patch'] || 'Unknown';
  const buildFingerprint = props['ro.build.fingerprint'] || `${brand}/${deviceName}:user/release-keys`;
  const cpuAbi = props['ro.product.cpu.abi'] || 'arm64-v8a';

  return {
    serial: resolvedSerial,
    manufacturer,
    brand,
    model,
    deviceName,
    androidVersion,
    sdkInt,
    securityPatch,
    buildFingerprint,
    cpuAbi,
    formFactor: detectFormFactor(props),
    oemSkin: detectOemSkin(props, manufacturer),
    usedMock: result.usedMock,
  };
}
