/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  EncryptionTransformer,
  encryptionTransformer,
} from './encryption.transformer';
import { CryptoServicePort } from '@domain/ports/services/crypto-service.port';

describe('EncryptionTransformer', () => {
  let mockCryptoService: jest.Mocked<CryptoServicePort>;
  let encryptSpy: jest.SpyInstance;
  let decryptSpy: jest.SpyInstance;
  let transformer: EncryptionTransformer;

  beforeEach(() => {
    mockCryptoService = {
      encrypt: jest.fn(
        (val: string | null | undefined): string | null | undefined =>
          val ? `enc:${val}` : val,
      ),
      decrypt: jest.fn(
        (val: string | null | undefined): string | null | undefined =>
          val && typeof val === 'string' && val.startsWith('enc:')
            ? val.replace('enc:', '')
            : val,
      ),
      hashBlindIndex: jest.fn(
        (val: string | null | undefined): string | null | undefined =>
          val ? `hash:${val}` : val,
      ),
      isEncrypted: jest.fn(
        (val: string | null | undefined): boolean =>
          typeof val === 'string' && val.startsWith('enc:'),
      ),
    };

    encryptSpy = jest.spyOn(mockCryptoService, 'encrypt');
    decryptSpy = jest.spyOn(mockCryptoService, 'decrypt');

    transformer = new EncryptionTransformer(mockCryptoService);
  });

  describe('to (encrypt)', () => {
    it('should encrypt valid string', () => {
      const result = transformer.to('hello@test.com');
      expect(encryptSpy).toHaveBeenCalledWith('hello@test.com');
      expect(result).toBe('enc:hello@test.com');
    });

    it('should pass through null, undefined, or empty string without calling service', () => {
      expect(transformer.to(null)).toBeNull();
      expect(transformer.to(undefined)).toBeUndefined();
      expect(transformer.to('')).toBe('');
      expect(encryptSpy).not.toHaveBeenCalled();
    });
  });

  describe('from (decrypt)', () => {
    it('should decrypt valid string', () => {
      const result = transformer.from('enc:hello@test.com');
      expect(decryptSpy).toHaveBeenCalledWith('enc:hello@test.com');
      expect(result).toBe('hello@test.com');
    });

    it('should pass through null, undefined, or empty string without calling service', () => {
      expect(transformer.from(null)).toBeNull();
      expect(transformer.from(undefined)).toBeUndefined();
      expect(transformer.from('')).toBe('');
      expect(decryptSpy).not.toHaveBeenCalled();
    });
  });

  describe('default export singleton', () => {
    it('should instantiate encryptionTransformer singleton', () => {
      expect(encryptionTransformer).toBeInstanceOf(EncryptionTransformer);
    });
  });
});
