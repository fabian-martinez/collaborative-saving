/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  parseEncryptionKey,
  resolveDatabaseSslConfig,
  validateEnvConfig,
} from './env.validation';

describe('env.validation', () => {
  describe('parseEncryptionKey', () => {
    it('should parse a 64-character hex string into a 32-byte Buffer', () => {
      // ARRANGE
      const hexKey =
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      // ACT
      const buf = parseEncryptionKey(hexKey);

      // ASSERT
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBe(32);
    });

    it('should throw an error when key is empty or invalid length', () => {
      // ARRANGE & ACT & ASSERT
      expect(() => parseEncryptionKey('')).toThrow(
        'Encryption key must be a non-empty string',
      );
      expect(() => parseEncryptionKey('short-key')).toThrow(
        'Invalid APP_ENCRYPTION_KEY',
      );
    });
  });

  describe('validateEnvConfig', () => {
    it('should pass validation in non-production environments without encryption keys', () => {
      // ARRANGE
      const config = { NODE_ENV: 'development' };

      // ACT
      const result = validateEnvConfig(config);

      // ASSERT
      expect(result).toEqual(config);
    });

    it('should throw in production when APP_ENCRYPTION_KEY or APP_BLIND_INDEX_SALT is missing', () => {
      // ARRANGE & ACT & ASSERT
      expect(() => validateEnvConfig({ NODE_ENV: 'production' })).toThrow(
        'APP_ENCRYPTION_KEY is mandatory in production environment',
      );

      expect(() =>
        validateEnvConfig({
          NODE_ENV: 'production',
          APP_ENCRYPTION_KEY:
            '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          APP_BLIND_INDEX_SALT: 'short',
        }),
      ).toThrow(
        'APP_BLIND_INDEX_SALT is mandatory and must be at least 16 characters in production environment',
      );
    });
  });

  describe('resolveDatabaseSslConfig', () => {
    it('should return false when SSL is not enabled and URL does not require SSL', () => {
      // ARRANGE & ACT
      const result = resolveDatabaseSslConfig(
        'postgresql://postgres:postgres@localhost:5432/db',
        'false',
      );

      // ASSERT
      expect(result).toBe(false);
    });

    it('should return { rejectUnauthorized: true } by default when DATABASE_SSL is true', () => {
      // ARRANGE & ACT
      const result = resolveDatabaseSslConfig(
        'postgresql://user:pass@host.neon.tech/neondb',
        'true',
      );

      // ASSERT
      expect(result).toEqual({ rejectUnauthorized: true });
    });

    it('should return { rejectUnauthorized: true } when URL includes neon.tech or sslmode=require', () => {
      // ARRANGE & ACT
      const result = resolveDatabaseSslConfig(
        'postgresql://user:pass@ep-cool.us-east-2.aws.neon.tech/neondb?sslmode=require',
        undefined,
      );

      // ASSERT
      expect(result).toEqual({ rejectUnauthorized: true });
    });

    it('should allow { rejectUnauthorized: false } only when DATABASE_SSL_REJECT_UNAUTHORIZED is explicitly "false"', () => {
      // ARRANGE & ACT
      const result = resolveDatabaseSslConfig(
        'postgresql://user:pass@custom-self-signed-db:5432/db',
        'true',
        'false',
      );

      // ASSERT
      expect(result).toEqual({ rejectUnauthorized: false });
    });
  });
});
