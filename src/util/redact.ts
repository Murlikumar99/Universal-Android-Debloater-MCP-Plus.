import crypto from 'node:crypto';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IMEI_REGEX = /\b\d{15}\b/g;
const PHONE_REGEX = /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g;
const TOKEN_SECRET_REGEX = /uad_tok_[a-f0-9]{32,64}/gi;

export function redactSensitiveText(input: string, redactSerials = false, knownSerial?: string): string {
  if (!input) return input;
  let result = input
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(IMEI_REGEX, '[REDACTED_IMEI]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(TOKEN_SECRET_REGEX, '[REDACTED_APPROVAL_TOKEN]');

  if (redactSerials && knownSerial && knownSerial.length >= 4) {
    const serialHash = crypto.createHash('sha256').update(knownSerial).digest('hex').slice(0, 8);
    result = result.split(knownSerial).join(`device_${serialHash}`);
  }
  return result;
}

export function maskSerial(serial: string): string {
  if (!serial) return 'unknown';
  if (serial.length <= 6) return `${serial.slice(0, 2)}***`;
  return `${serial.slice(0, 3)}***${serial.slice(-3)}`;
}
