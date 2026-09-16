/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export function parseEncryptionKey(rawKey: string): Buffer {
  if (!rawKey || typeof rawKey !== 'string') {
    throw new Error('Encryption key must be a non-empty string');
  }

  const trimmed = rawKey.trim();

  // 64-char hex string -> 32 bytes
  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  // 44-char base64 string -> 32 bytes
  if (trimmed.length === 44 && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    const buf = Buffer.from(trimmed, 'base64');
    if (buf.length === 32) {
      return buf;
    }
  }

  // 32-char utf8 string -> 32 bytes
  if (Buffer.byteLength(trimmed, 'utf8') === 32) {
    return Buffer.from(trimmed, 'utf8');
  }

  throw new Error(
    'Invalid APP_ENCRYPTION_KEY: Must be exactly 32 bytes (64-char hex, 44-char base64, or 32 raw bytes)',
  );
}

export function validateEnvConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const isProduction = config.NODE_ENV === 'production';

  if (isProduction) {
    const encryptionKey = config.APP_ENCRYPTION_KEY;
    if (typeof encryptionKey !== 'string' || !encryptionKey) {
      throw new Error(
        'APP_ENCRYPTION_KEY is mandatory in production environment',
      );
    }
    parseEncryptionKey(encryptionKey);

    const blindIndexSalt = config.APP_BLIND_INDEX_SALT;
    if (typeof blindIndexSalt !== 'string' || blindIndexSalt.length < 16) {
      throw new Error(
        'APP_BLIND_INDEX_SALT is mandatory and must be at least 16 characters in production environment',
      );
    }
  }

  return config;
}
