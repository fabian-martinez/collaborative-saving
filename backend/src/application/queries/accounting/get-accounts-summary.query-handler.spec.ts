/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { BadRequestException } from '@nestjs/common';
import { GetAccountsSummaryQueryHandler } from './get-accounts-summary.query-handler';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  INVESTMENT_IN_STOCKS_ACCOUNT,
  DIVIDENDS_PAYABLE_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  STOCK_TRANSFER_ACCOUNT,
  REVALUATION_SURPLUS_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
  ACCUMULATED_SURPLUS_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  FEE_INCOME_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  INSURANCE_INCOME_ACCOUNT,
  DIVIDEND_EXPENSE_ACCOUNT,
  OTHER_EXPENSES_ACCOUNT,
  NOVELTY_LOSS_ACCOUNT,
  AccountType,
} from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

describe('GetAccountsSummaryQueryHandler', () => {
  let queryHandler: GetAccountsSummaryQueryHandler;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let getAccountsSummarySpy: jest.SpyInstance;

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

    getAccountsSummarySpy = jest.spyOn(
      ledgerEntryRepository,
      'getAccountsSummary',
    );

    queryHandler = new GetAccountsSummaryQueryHandler(ledgerEntryRepository);
  });

  describe('execute', () => {
    it('should throw BadRequestException when startDate is after endDate', async () => {
      // ARRANGE
      const query = {
        startDate: '2024-12-31T00:00:00Z',
        endDate: '2024-01-01T00:00:00Z',
      };

      // ACT & ASSERT
      await expect(queryHandler.execute(query)).rejects.toThrow(
        BadRequestException,
      );
      expect(getAccountsSummarySpy).not.toHaveBeenCalled();
    });

    it('should return sorted accounts summary, filtering zero balances by default', async () => {
      // ARRANGE
      const now = new Date('2024-05-01T12:00:00Z');
      ledgerEntryRepository.getAccountsSummary.mockResolvedValue([
        {
          accountType: INTEREST_INCOME_ACCOUNT,
          totalBalance: -500,
          totalDebits: 0,
          totalCredits: 500,
          entriesCount: 1,
          entries: [
            {
              id: 'entry-1',
              operationId: 'op-1',
              accountType: INTEREST_INCOME_ACCOUNT,
              amount: -500,
              createdAt: now,
              description: 'Interest',
              loanId: 'loan-1',
              stockId: null,
              mandatoryContributionId: null,
              stockSubscriptionId: null,
              operationType: OperationType.LOAN_PAYMENT,
              operationDate: now,
            },
          ],
        },
        {
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          totalBalance: 2000,
          totalDebits: 2000,
          totalCredits: 0,
          entriesCount: 15,
          entries: [
            {
              id: 'entry-2',
              operationId: 'op-2',
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: 2000,
              createdAt: now,
              description: null,
              loanId: null,
              stockId: null,
              mandatoryContributionId: null,
              stockSubscriptionId: null,
              operationType: undefined,
              operationDate: undefined,
            },
          ],
        },
        {
          accountType: CASH_ACCOUNT,
          totalBalance: 1000,
          totalDebits: 1000,
          totalCredits: 0,
          entriesCount: 2,
          entries: [],
        },
        {
          accountType: FEE_INCOME_ACCOUNT,
          totalBalance: 0,
          totalDebits: 100,
          totalCredits: 100,
          entriesCount: 2,
          entries: [],
        },
      ]);

      // ACT
      const result = await queryHandler.execute({});

      // ASSERT
      expect(getAccountsSummarySpy).toHaveBeenCalledWith(
        {
          startDate: undefined,
          endDate: undefined,
          accountTypes: undefined,
        },
        10,
      );
      expect(result.accounts).toHaveLength(3);
      expect(result.accounts.map((a) => a.accountType)).toEqual([
        CASH_ACCOUNT,
        LOANS_RECEIVABLE_ACCOUNT,
        INTEREST_INCOME_ACCOUNT,
      ]);
      expect(result.accounts[0].accountName).toBe('Efectivo');
      expect(result.accounts[0].hasMoreEntries).toBe(false);
      expect(result.accounts[1].hasMoreEntries).toBe(true);
      expect(result.accounts[1].entries[0].operationType).toBeUndefined();
      expect(result.accounts[2].entries[0].operationType).toBe(
        OperationType.LOAN_PAYMENT,
      );
      expect(result.summary).toEqual({
        totalAccounts: 3,
        totalDebits: 3000,
        totalCredits: 500,
        netBalance: 2500,
      });
      expect(result.metadata.entriesLimit).toBe(10);
      expect(result.metadata.dateRange).toBeUndefined();
    });

    it('should include zero balance accounts, dateRange metadata, and handle unknown account types when requested', async () => {
      // ARRANGE
      const allKnownTypes: AccountType[] = [
        CASH_ACCOUNT,
        LOANS_RECEIVABLE_ACCOUNT,
        INVESTMENT_IN_STOCKS_ACCOUNT,
        DIVIDENDS_PAYABLE_ACCOUNT,
        STOCK_CAPITAL_ACCOUNT,
        STOCK_TRANSFER_ACCOUNT,
        REVALUATION_SURPLUS_ACCOUNT,
        MEMBER_EQUITY_ACCOUNT,
        ACCUMULATED_SURPLUS_ACCOUNT,
        INTEREST_INCOME_ACCOUNT,
        FEE_INCOME_ACCOUNT,
        MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
        INSURANCE_INCOME_ACCOUNT,
        DIVIDEND_EXPENSE_ACCOUNT,
        OTHER_EXPENSES_ACCOUNT,
        NOVELTY_LOSS_ACCOUNT,
        'UNKNOWN_ACCOUNT' as AccountType,
      ];

      ledgerEntryRepository.getAccountsSummary.mockResolvedValue(
        allKnownTypes.map((accountType) => ({
          accountType,
          totalBalance: 0,
          totalDebits: 0,
          totalCredits: 0,
          entriesCount: 0,
          entries: [],
        })),
      );

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-06-30T23:59:59Z';

      // ACT
      const result = await queryHandler.execute({
        startDate,
        endDate,
        accountTypes: [CASH_ACCOUNT],
        includeZeroBalance: true,
        entriesLimit: 5,
      });

      // ASSERT
      expect(getAccountsSummarySpy).toHaveBeenCalledWith(
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          accountTypes: [CASH_ACCOUNT],
        },
        5,
      );
      expect(result.accounts).toHaveLength(allKnownTypes.length);
      const unknownAccount = result.accounts[result.accounts.length - 1];
      expect(unknownAccount.accountType).toBe('UNKNOWN_ACCOUNT');
      expect(unknownAccount.accountName).toBe('UNKNOWN_ACCOUNT');
      expect(result.metadata.dateRange).toEqual({
        startDate,
        endDate,
      });
      expect(result.metadata.entriesLimit).toBe(5);
    });
  });
});
