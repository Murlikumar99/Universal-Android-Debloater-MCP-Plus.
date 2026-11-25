import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { getDefaultDataDir } from '../config';
import { DebloaterError } from './errors';

export function ensureDir(dirPath: string): string {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function getSubDir(subPath: string): string {
  const base = getDefaultDataDir();
  const baseResolved = path.resolve(base);
  const resolved = path.resolve(baseResolved, subPath);
  const rel = path.relative(baseResolved, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new DebloaterError(
      'PATH_TRAVERSAL_BLOCKED',
      `Path traversal detected: ${subPath} escapes data directory.`
    );
  }
  return ensureDir(resolved);
}

export function safeResolveUnder(baseDir: string, relativeTarget: string): string {
  const normalizedBase = path.resolve(baseDir);
  const resolved = path.resolve(normalizedBase, relativeTarget);
  const rel = path.relative(normalizedBase, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new DebloaterError(
      'PATH_TRAVERSAL_BLOCKED',
      `Security violation: target path "${relativeTarget}" escapes base directory.`
    );
  }
  return resolved;
}

export function hashSerial(serial: string): string {
  return crypto.createHash('sha256').update(serial).digest('hex').slice(0, 12);
}
