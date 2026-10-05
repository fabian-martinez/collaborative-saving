/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Client } from 'pg';
import { rotatePiiEncryption } from './rotate-pii-encryption';
import { CryptoService } from '../infrastructure/services/crypto/crypto.service';

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe('rotatePiiEncryption', () => {
  const oldKey =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const oldSalt = 'old_salt_test';
  const newKey =
    'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
  const newSalt = 'new_salt_test';
  const dbUrl = 'postgresql://postgres:postgres@localhost:5432/test_db';

  let mockClientInstance: {
    connect: jest.Mock;
    query: jest.Mock;
    end: jest.Mock;
  };
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientInstance = new (Client as unknown as jest.Mock)() as {
      connect: jest.Mock;
      query: jest.Mock;
      end: jest.Mock;
    };
    mockClientInstance.connect.mockResolvedValue(undefined);
    mockClientInstance.query.mockResolvedValue({ rows: [] });
    mockClientInstance.end.mockResolvedValue(undefined);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should re-encrypt members and log only member ID without exposing names or PII', async () => {
    // ARRANGE
    const oldCrypto = new CryptoService(undefined, oldKey, oldSalt);
    const newCrypto = new CryptoService(undefined, newKey, newSalt);

    const testEmail = 'member@example.com';
    const testId = 'member-uuid-1234';
    const encryptedOldEmail = oldCrypto.encrypt(testEmail);
    const oldEmailHash = oldCrypto.hashBlindIndex(testEmail);
    const encryptedNewEmail = newCrypto.encrypt(testEmail);
    const newEmailHash = newCrypto.hashBlindIndex(testEmail);

    mockClientInstance.query
      // 1. Initial SELECT query
      .mockResolvedValueOnce({
        rows: [
          {
            id: testId,
            email: encryptedOldEmail,
            identification_number: null,
            phone: null,
            address: null,
            beneficiary: null,
            email_hash: oldEmailHash,
            identification_number_hash: null,
          },
        ],
      })
      // 2. UPDATE query
      .mockResolvedValueOnce({ rowCount: 1 })
      // 3. Verification SELECT query
      .mockResolvedValueOnce({
        rows: [
          {
            id: testId,
            email: encryptedNewEmail,
            identification_number: null,
            email_hash: newEmailHash,
            identification_number_hash: null,
          },
        ],
      });

    // ACT
    await rotatePiiEncryption(dbUrl, oldKey, oldSalt, newKey, newSalt);

    // ASSERT
    // Verify client connection lifecycle
    expect(mockClientInstance.connect).toHaveBeenCalledTimes(1);
    expect(mockClientInstance.end).toHaveBeenCalledTimes(1);

    // Verify initial SELECT query does not select name column (Data Minimization)
    expect(mockClientInstance.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT id, email'),
    );
    expect(mockClientInstance.query).toHaveBeenNthCalledWith(
      1,
      expect.not.stringContaining('name'),
    );

    // Verify verification SELECT query does not select name column
    expect(mockClientInstance.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('SELECT id, email'),
    );
    expect(mockClientInstance.query).toHaveBeenNthCalledWith(
      3,
      expect.not.stringContaining('name'),
    );

    // Verify log statement includes member ID but NEVER member name or PII
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `[PII-Rotation] Re-encrypted member ${testId}`,
    );

    // Ensure no log call contains any name string or pattern
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/Re-encrypted member.*\(.*\)/),
    );
  });

  it('should handle empty member list without error and close connection', async () => {
    // ARRANGE
    mockClientInstance.query
      .mockResolvedValueOnce({ rows: [] }) // Initial SELECT
      .mockResolvedValueOnce({ rows: [] }); // Verification SELECT

    // ACT
    await rotatePiiEncryption(dbUrl, oldKey, oldSalt, newKey, newSalt);

    // ASSERT
    expect(mockClientInstance.connect).toHaveBeenCalledTimes(1);
    expect(mockClientInstance.end).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[PII-Rotation] Found 0 members to re-encrypt.',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[PII-Rotation] Successfully re-encrypted 0 members with new key.',
    );
  });

  it('should throw error when verification fails and still close database connection', async () => {
    // ARRANGE
    const oldCrypto = new CryptoService(undefined, oldKey, oldSalt);
    const testId = 'member-failed-verify';

    mockClientInstance.query
      // 1. Initial SELECT query
      .mockResolvedValueOnce({
        rows: [
          {
            id: testId,
            email: oldCrypto.encrypt('test@example.com'),
            identification_number: null,
            phone: null,
            address: null,
            beneficiary: null,
            email_hash: oldCrypto.hashBlindIndex('test@example.com'),
            identification_number_hash: null,
          },
        ],
      })
      // 2. UPDATE query
      .mockResolvedValueOnce({ rowCount: 1 })
      // 3. Verification SELECT query returning unencrypted / mismatched hash
      .mockResolvedValueOnce({
        rows: [
          {
            id: testId,
            email: 'plain-corrupted-email@example.com',
            identification_number: null,
            email_hash: 'mismatched-hash',
            identification_number_hash: null,
          },
        ],
      });

    // ACT & ASSERT
    await expect(
      rotatePiiEncryption(dbUrl, oldKey, oldSalt, newKey, newSalt),
    ).rejects.toThrow(
      /\[PII-Rotation\] Rotation verification encountered \d+ errors\./,
    );

    expect(mockClientInstance.end).toHaveBeenCalledTimes(1);
  });
});
