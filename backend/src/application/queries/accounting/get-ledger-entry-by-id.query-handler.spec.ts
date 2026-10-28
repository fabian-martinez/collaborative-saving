/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetLedgerEntryByIdQueryHandler } from './get-ledger-entry-by-id.query-handler';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';
import { LedgerEntryNotFoundException } from '@application/exceptions/ledger-entry-not-found.exception';

describe('GetLedgerEntryByIdQueryHandler', () => {
  let queryHandler: GetLedgerEntryByIdQueryHandler;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let findByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
      getAccountsSummary: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    findByIdSpy = jest.spyOn(ledgerEntryRepository, 'findById');
    queryHandler = new GetLedgerEntryByIdQueryHandler(ledgerEntryRepository);
  });

  describe('execute', () => {
    it('should throw LedgerEntryNotFoundException when ledger entry does not exist', async () => {
      // ARRANGE
      ledgerEntryRepository.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(queryHandler.execute('missing-id')).rejects.toThrow(
        LedgerEntryNotFoundException,
      );
      expect(findByIdSpy).toHaveBeenCalledWith('missing-id');
    });

    it('should return ledger entry DTO with populated optional fields', async () => {
      // ARRANGE
      const entry = LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 2500,
        description: 'Entry description',
        loanId: 'loan-1',
        stockId: 'stock-1',
        mandatoryContributionId: 'mc-1',
        stockSubscriptionId: 'sub-1',
      });
      ledgerEntryRepository.findById.mockResolvedValue(entry);

      // ACT
      const result = await queryHandler.execute(entry.id);

      // ASSERT
      expect(findByIdSpy).toHaveBeenCalledWith(entry.id);
      expect(result).toEqual({
        id: entry.id,
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 2500,
        createdAt: entry.createdAt,
        description: 'Entry description',
        loanId: 'loan-1',
        stockId: 'stock-1',
        mandatoryContributionId: 'mc-1',
        stockSubscriptionId: 'sub-1',
      });
    });

    it('should map undefined optional fields to null', async () => {
      // ARRANGE
      const entry = LedgerEntry.create({
        operationId: 'op-2',
        accountType: CASH_ACCOUNT,
        amount: 500,
      });
      ledgerEntryRepository.findById.mockResolvedValue(entry);

      // ACT
      const result = await queryHandler.execute(entry.id);

      // ASSERT
      expect(result).toEqual({
        id: entry.id,
        operationId: 'op-2',
        accountType: CASH_ACCOUNT,
        amount: 500,
        createdAt: entry.createdAt,
        description: null,
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      });
    });
  });
});
