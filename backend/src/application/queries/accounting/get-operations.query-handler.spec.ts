import { GetOperationsQueryHandler } from './get-operations.query-handler';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { CASH_ACCOUNT, STOCK_CAPITAL_ACCOUNT } from '@domain/constants/account-types';

describe('GetOperationsQueryHandler', () => {
  let queryHandler: GetOperationsQueryHandler;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;

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

    queryHandler = new GetOperationsQueryHandler(
      operationRepository,
      ledgerEntryRepository,
    );
  });

  describe('execute', () => {
    it('should return paginated operations without filters', async () => {
      const operations: Operation[] = [
        Operation.create({
          meetingId: 'meeting-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
        }),
        Operation.create({
          meetingId: 'meeting-1',
          type: OperationType.STOCK_PURCHASE,
          date: new Date('2024-01-16'),
        }),
      ];

      operationRepository.findWithPagination.mockResolvedValue({
        data: operations,
        total: 2,
      });

      ledgerEntryRepository.findByOperations.mockResolvedValue([]);

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].entries).toEqual([]);
      expect(result.data[1].entries).toEqual([]);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
      expect(operationRepository.findWithPagination).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 },
        'DESC',
      );
      expect(ledgerEntryRepository.findByOperations).toHaveBeenCalledWith([
        operations[0].id,
        operations[1].id,
      ]);
    });

    it('should apply filters correctly', async () => {
      const memberId = 'member-1';
      const meetingId = 'meeting-1';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';
      const type = OperationType.MONTHLY_PAYMENT;

      operationRepository.findWithPagination.mockResolvedValue({
        data: [],
        total: 0,
      });

      ledgerEntryRepository.findByOperations.mockResolvedValue([]);

      await queryHandler.execute({
        memberId,
        meetingId,
        startDate,
        endDate,
        type,
        page: 1,
        limit: 10,
        orderBy: 'ASC',
      });

      expect(operationRepository.findWithPagination).toHaveBeenCalledWith(
        {
          memberId,
          meetingId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          type,
        },
        { page: 1, limit: 10 },
        'ASC',
      );
    });

    it('should use default values for pagination and orderBy', async () => {
      operationRepository.findWithPagination.mockResolvedValue({
        data: [],
        total: 0,
      });

      ledgerEntryRepository.findByOperations.mockResolvedValue([]);

      const result = await queryHandler.execute({});

      expect(operationRepository.findWithPagination).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 },
        'DESC',
      );
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should calculate totalPages correctly', async () => {
      operationRepository.findWithPagination.mockResolvedValue({
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

    it('should map operations to response DTOs correctly', async () => {
      const operation = Operation.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Test operation',
      });

      operationRepository.findWithPagination.mockResolvedValue({
        data: [operation],
        total: 1,
      });

      ledgerEntryRepository.findByOperations.mockResolvedValue([]);

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
      });

      expect(result.data[0]).toEqual({
        id: operation.id,
        memberId: operation.memberId,
        meetingId: operation.meetingId,
        type: operation.type,
        date: operation.date,
        description: operation.description,
        entries: [],
      });
    });

    it('should handle null description correctly', async () => {
      const operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
      });

      operationRepository.findWithPagination.mockResolvedValue({
        data: [operation],
        total: 1,
      });

      ledgerEntryRepository.findByOperations.mockResolvedValue([]);

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
      });

      expect(result.data[0].description).toBeNull();
      expect(result.data[0].entries).toEqual([]);
    });

    it('should include ledger entries for operations', async () => {
      const operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
      });

      const entry1 = LedgerEntry.create({
        operationId: operation.id,
        accountType: CASH_ACCOUNT,
        amount: 100,
        description: 'Cash entry',
      });

      const entry2 = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -100,
        description: 'Stock capital entry',
      });

      operationRepository.findWithPagination.mockResolvedValue({
        data: [operation],
        total: 1,
      });

      ledgerEntryRepository.findByOperations.mockResolvedValue([
        entry1,
        entry2,
      ]);

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
      });

      expect(result.data[0].entries).toHaveLength(2);
      expect(result.data[0].entries[0]).toEqual({
        id: entry1.id,
        operationId: entry1.operationId,
        accountType: entry1.accountType,
        amount: entry1.amount,
        createdAt: entry1.createdAt,
        description: entry1.description,
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      });
      expect(result.data[0].entries[1]).toEqual({
        id: entry2.id,
        operationId: entry2.operationId,
        accountType: entry2.accountType,
        amount: entry2.amount,
        createdAt: entry2.createdAt,
        description: entry2.description,
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      });
    });

    it('should handle operations with no entries', async () => {
      const operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
      });

      operationRepository.findWithPagination.mockResolvedValue({
        data: [operation],
        total: 1,
      });

      ledgerEntryRepository.findByOperations.mockResolvedValue([]);

      const result = await queryHandler.execute({
        page: 1,
        limit: 10,
      });

      expect(result.data[0].entries).toEqual([]);
    });
  });
});

