/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetOperationByIdQueryHandler } from './get-operation-by-id.query-handler';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { CASH_ACCOUNT } from '@domain/constants/account-types';
import { OperationNotFoundException } from '@application/exceptions/operation-not-found.exception';

describe('GetOperationByIdQueryHandler', () => {
  let queryHandler: GetOperationByIdQueryHandler;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let findByIdSpy: jest.SpyInstance;
  let findByOperationSpy: jest.SpyInstance;

  beforeEach(() => {
    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMember: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

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

    findByIdSpy = jest.spyOn(operationRepository, 'findById');
    findByOperationSpy = jest.spyOn(ledgerEntryRepository, 'findByOperation');

    queryHandler = new GetOperationByIdQueryHandler(
      operationRepository,
      ledgerEntryRepository,
    );
  });

  describe('execute', () => {
    it('should throw OperationNotFoundException when operation is not found', async () => {
      // ARRANGE
      operationRepository.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(queryHandler.execute('non-existent-id')).rejects.toThrow(
        OperationNotFoundException,
      );
      expect(findByIdSpy).toHaveBeenCalledWith('non-existent-id');
      expect(findByOperationSpy).not.toHaveBeenCalled();
    });

    it('should return operation with mapped ledger entries and populated optional fields', async () => {
      // ARRANGE
      const operation = Operation.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-05-01'),
        description: 'Monthly payment operation',
      });

      const entryWithFields = LedgerEntry.create({
        operationId: operation.id,
        accountType: CASH_ACCOUNT,
        amount: 1000,
        description: 'Cash payment',
        loanId: 'loan-1',
        stockId: 'stock-1',
        mandatoryContributionId: 'mc-1',
        stockSubscriptionId: 'sub-1',
      });

      const entryWithNulls = LedgerEntry.create({
        operationId: operation.id,
        accountType: CASH_ACCOUNT,
        amount: -1000,
      });

      operationRepository.findById.mockResolvedValue(operation);
      ledgerEntryRepository.findByOperation.mockResolvedValue([
        entryWithFields,
        entryWithNulls,
      ]);

      // ACT
      const result = await queryHandler.execute(operation.id);

      // ASSERT
      expect(findByIdSpy).toHaveBeenCalledWith(operation.id);
      expect(findByOperationSpy).toHaveBeenCalledWith(operation.id);
      expect(result).toEqual({
        id: operation.id,
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: operation.date,
        description: 'Monthly payment operation',
        entries: [
          {
            id: entryWithFields.id,
            operationId: operation.id,
            accountType: CASH_ACCOUNT,
            amount: 1000,
            createdAt: entryWithFields.createdAt,
            description: 'Cash payment',
            loanId: 'loan-1',
            stockId: 'stock-1',
            mandatoryContributionId: 'mc-1',
            stockSubscriptionId: 'sub-1',
          },
          {
            id: entryWithNulls.id,
            operationId: operation.id,
            accountType: CASH_ACCOUNT,
            amount: -1000,
            createdAt: entryWithNulls.createdAt,
            description: null,
            loanId: null,
            stockId: null,
            mandatoryContributionId: null,
            stockSubscriptionId: null,
          },
        ],
      });
    });

    it('should return null description when operation description is omitted', async () => {
      // ARRANGE
      const operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.STOCK_PURCHASE,
        date: new Date('2024-05-01'),
      });

      operationRepository.findById.mockResolvedValue(operation);
      ledgerEntryRepository.findByOperation.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(operation.id);

      // ASSERT
      expect(result.description).toBeNull();
      expect(result.entries).toEqual([]);
    });
  });
});
