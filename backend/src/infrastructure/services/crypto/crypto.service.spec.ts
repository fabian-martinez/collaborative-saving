/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { CryptoService } from './crypto.service';
import { parseEncryptionKey } from '../../config/env.validation';

describe('CryptoService', () => {
  const testKeyHex =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const testSalt = 'test_salt_collaborative_saving_2026';
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService(undefined, testKeyHex, testSalt);
  });

  describe('parseEncryptionKey', () => {
    it('should parse 64-char hex key', () => {
      const buf = parseEncryptionKey(testKeyHex);
      expect(buf.length).toBe(32);
    });

    it('should parse 44-char base64 key', () => {
      const base64Key = Buffer.from(testKeyHex, 'hex').toString('base64');
      const buf = parseEncryptionKey(base64Key);
      expect(buf.length).toBe(32);
    });

    it('should parse 32-char utf8 key', () => {
      const utf8Key = '12345678901234567890123456789012';
      const buf = parseEncryptionKey(utf8Key);
      expect(buf.length).toBe(32);
    });

    it('should throw for invalid key length or format', () => {
      expect(() => parseEncryptionKey('too-short')).toThrow(
        'Invalid APP_ENCRYPTION_KEY',
      );
      expect(() => parseEncryptionKey('')).toThrow(
        'Encryption key must be a non-empty string',
      );
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string successfully', () => {
      const plaintext = 'juan.perez@example.com';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(service.isEncrypted(encrypted)).toBe(true);

      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should support special characters and unicode', () => {
      const plaintext = 'Cra 45 # 12-34 Bogotá D.C. ¡Éxito! 🚀';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext (probabilistic IV)', () => {
      const plaintext = 'secret_phone_number_+573001234567';
      const enc1 = service.encrypt(plaintext);
      const enc2 = service.encrypt(plaintext);

      expect(enc1).not.toBe(enc2);
      expect(service.decrypt(enc1)).toBe(plaintext);
      expect(service.decrypt(enc2)).toBe(plaintext);
    });

    it('should handle null, undefined, and empty strings gracefully', () => {
      expect(service.encrypt(null)).toBeNull();
      expect(service.encrypt(undefined)).toBeUndefined();
      expect(service.encrypt('')).toBe('');

      expect(service.decrypt(null)).toBeNull();
      expect(service.decrypt(undefined)).toBeUndefined();
      expect(service.decrypt('')).toBe('');
    });

    it('should be idempotent (not re-encrypt already encrypted string)', () => {
      const plaintext = 'test-id-12345678';
      const encrypted = service.encrypt(plaintext);
      const doubleEncrypted = service.encrypt(encrypted);

      expect(doubleEncrypted).toBe(encrypted);
    });

    it('should return legacy unencrypted text as-is during decrypt', () => {
      const legacyText = 'legacy_plain_email@example.com';
      const result = service.decrypt(legacyText);

      expect(result).toBe(legacyText);
    });

    it('should detect tampering and throw on corrupted ciphertext or auth tag', () => {
      const plaintext = 'sensitive_information';
      const encrypted = service.encrypt(plaintext)!;
      const parts = encrypted.split(':');

      // Alter ciphertext data
      const tamperedData =
        parts[3].substring(0, parts[3].length - 2) +
        (parts[3].endsWith('0') ? '1' : '0');
      const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedData}`;

      expect(() => service.decrypt(tampered)).toThrow(
        'Failed to decrypt ciphertext',
      );
    });

    it('should throw when version is unsupported', () => {
      const invalidVersion =
        'v2:012345678901234567890123:01234567890123456789012345678901:abcd';
      expect(() => service.decrypt(invalidVersion)).toThrow(
        'Unsupported encryption payload version: v2',
      );
    });
  });

  describe('hashBlindIndex', () => {
    it('should produce a deterministic 64-char hex hash', () => {
      const input = 'user@example.com';
      const hash1 = service.hashBlindIndex(input);
      const hash2 = service.hashBlindIndex(input);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash1!)).toBe(true);
    });

    it('should normalize trimmed values', () => {
      const hash1 = service.hashBlindIndex('user@example.com');
      const hash2 = service.hashBlindIndex('  user@example.com  ');

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different salts', () => {
      const service2 = new CryptoService(
        undefined,
        testKeyHex,
        'different_salt',
      );
      const input = 'user@example.com';

      const hash1 = service.hashBlindIndex(input);
      const hash2 = service2.hashBlindIndex(input);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle null, undefined, and empty string', () => {
      expect(service.hashBlindIndex(null)).toBeNull();
      expect(service.hashBlindIndex(undefined)).toBeUndefined();
      expect(service.hashBlindIndex('')).toBe('');
    });
  });

  describe('isEncrypted', () => {
    it('should identify valid v1 payloads', () => {
      const valid = service.encrypt('hello world');
      expect(service.isEncrypted(valid)).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(service.isEncrypted(null)).toBe(false);
      expect(service.isEncrypted('')).toBe(false);
      expect(service.isEncrypted('just a normal string')).toBe(false);
      expect(service.isEncrypted('v1:123:456')).toBe(false);
      expect(
        service.isEncrypted(
          'v2:123456789012345678901234:12345678901234567890123456789012:abcd',
        ),
      ).toBe(false);
    });
  });

  describe('getInstance', () => {
    it('should return a singleton CryptoService instance', () => {
      const inst = CryptoService.getInstance();
      expect(inst).toBeInstanceOf(CryptoService);
    });
  });
});
