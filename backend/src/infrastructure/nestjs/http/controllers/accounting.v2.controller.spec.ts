import { Test, TestingModule } from '@nestjs/testing';
import { AccountingV2Controller } from './accounting.v2.controller';
import { GetOperationsQueryHandler } from '@application/queries/accounting/get-operations.query-handler';
import { GetLedgerEntriesQueryHandler } from '@application/queries/accounting/get-ledger-entries.query-handler';
import { GetAccountsSummaryQueryHandler } from '@application/queries/accounting/get-accounts-summary.query-handler';
import { OperationType } from '@domain/enums/operation-type.enum';
import { CASH_ACCOUNT, AccountType } from '@domain/constants/account-types';
import { PaginatedResponse } from '@application/dto/accounting/paginated-response.dto';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';

describe('AccountingV2Controller', () => {
  let controller: AccountingV2Controller;
  let getOperationsQuery: jest.Mocked<GetOperationsQueryHandler>;
  let getLedgerEntriesQuery: jest.Mocked<GetLedgerEntriesQueryHandler>;
  let getAccountsSummaryQuery: jest.Mocked<GetAccountsSummaryQueryHandler>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountingV2Controller],
      providers: [
        {
          provide: GetOperationsQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetLedgerEntriesQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetAccountsSummaryQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AccountingV2Controller>(AccountingV2Controller);
    getOperationsQuery = module.get(GetOperationsQueryHandler);
    getLedgerEntriesQuery = module.get(GetLedgerEntriesQueryHandler);
    getAccountsSummaryQuery = module.get(GetAccountsSummaryQueryHandler);
  });

  describe('getOperations', () => {
    it('should return paginated operations', async () => {
      const mockResponse = {
        data: [
          {
            id: 'op-1',
            memberId: 'member-1',
            meetingId: 'meeting-1',
            type: OperationType.MONTHLY_PAYMENT,
            date: new Date('2024-01-15'),
            description: 'Test operation',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      getOperationsQuery.execute.mockResolvedValue(mockResponse);

      const result = await controller.getOperations({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });

      expect(result).toEqual(mockResponse);
      expect(getOperationsQuery.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });
    });

    it('should pass filters to query handler', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      getOperationsQuery.execute.mockResolvedValue(mockResponse);

      await controller.getOperations({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        type: OperationType.MONTHLY_PAYMENT,
        page: 1,
        limit: 10,
        orderBy: 'ASC',
      });

      expect(getOperationsQuery.execute).toHaveBeenCalledWith({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        type: OperationType.MONTHLY_PAYMENT,
        page: 1,
        limit: 10,
        orderBy: 'ASC',
      });
    });

    it('should handle optional query parameters', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      getOperationsQuery.execute.mockResolvedValue(mockResponse);

      await controller.getOperations({});

      expect(getOperationsQuery.execute).toHaveBeenCalledWith({
        memberId: undefined,
        meetingId: undefined,
        startDate: undefined,
        endDate: undefined,
        type: undefined,
        page: undefined,
        limit: undefined,
        orderBy: undefined,
      });
    });
  });

  describe('getLedgerEntries', () => {
    it('should return paginated ledger entries', async () => {
      const mockResponse: PaginatedResponse<LedgerEntryResponseDto> = {
        data: [
          {
            id: 'entry-1',
            operationId: 'operation-1',
            accountType: CASH_ACCOUNT,
            amount: 1000,
            createdAt: new Date('2024-01-15'),
            description: 'Test entry',
            loanId: null,
            stockId: null,
            mandatoryContributionId: null,
            stockSubscriptionId: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      getLedgerEntriesQuery.execute.mockResolvedValue(mockResponse);

      const result = await controller.getLedgerEntries({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });

      expect(result).toEqual(mockResponse);
      expect(getLedgerEntriesQuery.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });
    });

    it('should pass filters to query handler', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      getLedgerEntriesQuery.execute.mockResolvedValue(mockResponse);

      await controller.getLedgerEntries({
        memberId: 'member-1',
        accountType: CASH_ACCOUNT,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        page: 1,
        limit: 10,
        orderBy: 'ASC',
      });

      expect(getLedgerEntriesQuery.execute).toHaveBeenCalledWith({
        memberId: 'member-1',
        accountType: CASH_ACCOUNT,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        page: 1,
        limit: 10,
        orderBy: 'ASC',
      });
    });

    it('should handle optional query parameters', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      getLedgerEntriesQuery.execute.mockResolvedValue(mockResponse);

      await controller.getLedgerEntries({});

      expect(getLedgerEntriesQuery.execute).toHaveBeenCalledWith({
        memberId: undefined,
        accountType: undefined,
        startDate: undefined,
        endDate: undefined,
        page: undefined,
        limit: undefined,
        orderBy: undefined,
      });
    });
  });
});

