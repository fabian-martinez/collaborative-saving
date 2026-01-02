import { GetLedgerEntriesQueryHandler } from './get-ledger-entries.query-handler';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';

describe('GetLedgerEntriesQueryHandler', () => {
  let queryHandler: GetLedgerEntriesQueryHandler;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;

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
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    queryHandler = new GetLedgerEntriesQueryHandler(ledgerEntryRepository);
  });

  describe('execute', () => {
    it('should return paginated ledger entries without filters', async () => {
      const entries: LedgerEntry[] = [
        LedgerEntry.create({
          operationId: 'operation-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
        }),
        LedgerEntry.create({
          operationId: 'operation-2',
          accountType: CASH_ACCOUNT,
          amount: 2000,
        }),
      ];

      ledgerEntryRepository.findWithPagination.mockResolvedValue({
        data: entries,
        total: 2,
      });

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
      expect(ledgerEntryRepository.findWithPagination).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 },
        'DESC',
      );
    });

    it('should apply filters correctly', async () => {
      const memberId = 'member-1';
      const accountType = CASH_ACCOUNT;
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';

      ledgerEntryRepository.findWithPagination.mockResolvedValue({
        data: [],
        total: 0,
      });

      await queryHandler.execute({
        memberId,
        accountType,
        startDate,
        endDate,
        page: 1,
        limit: 10,
        orderBy: 'ASC',
      });

      expect(ledgerEntryRepository.findWithPagination).toHaveBeenCalledWith(
        {
          memberId,
          accountType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        { page: 1, limit: 10 },
        'ASC',
      );
    });

    it('should use default values for pagination and orderBy', async () => {
      ledgerEntryRepository.findWithPagination.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await queryHandler.execute({});

      expect(ledgerEntryRepository.findWithPagination).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 },
        'DESC',
      );
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should calculate totalPages correctly', async () => {
      ledgerEntryRepository.findWithPagination.mockResolvedValue({
        data: [],
        total: 25,
      });

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
      });

      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3); // Math.ceil(25/10)
    });

    it('should map ledger entries to response DTOs correctly', async () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
        description: 'Test entry',
      });

      ledgerEntryRepository.findWithPagination.mockResolvedValue({
        data: [entry],
        total: 1,
      });

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
      });

      expect(result.data[0]).toEqual({
        id: entry.id,
        operationId: entry.operationId,
        accountType: entry.accountType,
        amount: entry.amount,
        createdAt: entry.createdAt,
        description: entry.description,
        loanId: entry.loanId,
        stockId: entry.stockId,
        mandatoryContributionId: entry.mandatoryContributionId,
        stockSubscriptionId: entry.stockSubscriptionId,
      });
    });

    it('should handle null values correctly', async () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      });

      ledgerEntryRepository.findWithPagination.mockResolvedValue({
        data: [entry],
        total: 1,
      });

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
      });

      expect(result.data[0].description).toBeNull();
      expect(result.data[0].loanId).toBeNull();
      expect(result.data[0].stockId).toBeNull();
      expect(result.data[0].mandatoryContributionId).toBeNull();
      expect(result.data[0].stockSubscriptionId).toBeNull();
    });
  });
});

