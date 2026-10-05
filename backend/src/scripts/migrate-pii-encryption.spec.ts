/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Client } from 'pg';
import { migrate } from './migrate-pii-encryption';
import { CryptoService } from '../infrastructure/services/crypto/crypto.service';

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe('migratePiiEncryption', () => {
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

  it('should encrypt plaintext members and log only member ID without exposing names or PII', async () => {
    // ARRANGE
    const testId = 'member-uuid-5678';
    const testEmail = 'plain.member@example.com';
    const testIdNum = '9876543210';
    const testPhone = '3001234567';
    const testAddress = 'Carrera 7 # 12-34';
    const testBeneficiary = 'Beneficiary Name';

    mockClientInstance.query
      // 1. Initial SELECT query
      .mockResolvedValueOnce({
        rows: [
          {
            id: testId,
            email: testEmail,
            identification_number: testIdNum,
            phone: testPhone,
            address: testAddress,
            beneficiary: testBeneficiary,
            email_hash: null,
            identification_number_hash: null,
          },
        ],
      })
      // 2. UPDATE query
      .mockResolvedValueOnce({ rowCount: 1 })
      // 3. Verification query
      .mockResolvedValueOnce({
        rows: [
          {
            total: '1',
            hashed_emails: '1',
            encrypted_emails: '1',
          },
        ],
      });

    // ACT
    await migrate(dbUrl);

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

    // Verify log statement includes member ID but NEVER member name or PII
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `[PII-Migration] Encrypted & updated member: ${testId}`,
    );

    // Ensure no log call contains any name or parenthesis pattern
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/Encrypted & updated member:.*\(.*\)/),
    );
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(testBeneficiary),
    );
  });

  it('should not update already encrypted members', async () => {
    // ARRANGE
    const cryptoService = CryptoService.getInstance();
    const testId = 'already-encrypted-member';
    const encryptedEmail = cryptoService.encrypt('secure@example.com')!;
    const emailHash = cryptoService.hashBlindIndex('secure@example.com');
    const encryptedIdNum = cryptoService.encrypt('11223344')!;
    const idHash = cryptoService.hashBlindIndex('11223344');
    const encryptedPhone = cryptoService.encrypt('3110000000')!;
    const encryptedAddress = cryptoService.encrypt('Secure Street')!;
    const encryptedBeneficiary = cryptoService.encrypt('Secure Beneficiary')!;

    mockClientInstance.query
      // 1. Initial SELECT query
      .mockResolvedValueOnce({
        rows: [
          {
            id: testId,
            email: encryptedEmail,
            identification_number: encryptedIdNum,
            phone: encryptedPhone,
            address: encryptedAddress,
            beneficiary: encryptedBeneficiary,
            email_hash: emailHash,
            identification_number_hash: idHash,
          },
        ],
      })
      // 2. Verification query
      .mockResolvedValueOnce({
        rows: [
          {
            total: '1',
            hashed_emails: '1',
            encrypted_emails: '1',
          },
        ],
      });

    // ACT
    await migrate(dbUrl);

    // ASSERT
    // Client query should only have been called twice (initial select and verify, NO UPDATE)
    expect(mockClientInstance.query).toHaveBeenCalledTimes(2);
    expect(mockClientInstance.end).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[PII-Migration] Successfully migrated and encrypted 0 members.',
    );
  });

  it('should close connection if query fails', async () => {
    // ARRANGE
    mockClientInstance.query.mockRejectedValueOnce(
      new Error('DB connection lost'),
    );

    // ACT & ASSERT
    await expect(migrate(dbUrl)).rejects.toThrow('DB connection lost');
    expect(mockClientInstance.end).toHaveBeenCalledTimes(1);
  });
});
