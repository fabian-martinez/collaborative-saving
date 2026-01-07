import { Test, TestingModule } from '@nestjs/testing';
import { AccountingV2Controller } from './accounting.v2.controller';
import { GetOperationsQueryHandler } from '@application/queries/accounting/get-operations.query-handler';
import { GetLedgerEntriesQueryHandler } from '@application/queries/accounting/get-ledger-entries.query-handler';
import { GetAccountsSummaryQueryHandler } from '@application/queries/accounting/get-accounts-summary.query-handler';
import { OperationType } from '@domain/enums/operation-type.enum';
import { CASH_ACCOUNT, AccountType } from '@domain/constants/account-types';
import { PaginatedResponse } from '@application/dto/accounting/paginated-response.dto';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';
import { OperationResponseDto } from '@application/dto/accounting/operation-response.dto';
import { GetAccountsSummaryResponseDto } from '@application/dto/accounting/get-accounts-summary-response.dto';

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
    it('should return paginated operations with entries in snake_case', async () => {
      const mockResponse: PaginatedResponse<OperationResponseDto> = {
        data: [
          {
            id: 'op-1',
            memberId: 'member-1',
            meetingId: 'meeting-1',
            type: OperationType.MONTHLY_PAYMENT,
            date: new Date('2024-01-15'),
            description: 'Test operation',
            entries: [
              {
                id: 'entry-1',
                operationId: 'op-1',
                accountType: CASH_ACCOUNT as AccountType,
                amount: 100,
                createdAt: new Date('2024-01-15'),
                description: 'Cash entry',
                loanId: null,
                stockId: null,
                mandatoryContributionId: null,
                stockSubscriptionId: null,
              },
            ],
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
        order_by: 'DESC',
      });

      expect(result.data[0]).toEqual({
        id: 'op-1',
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Test operation',
        total_amount: 100,
        entries: [
          {
            id: 'entry-1',
            operation_id: 'op-1',
            account_type: CASH_ACCOUNT,
            amount: 100,
            created_at: new Date('2024-01-15'),
            description: 'Cash entry',
            loan_id: null,
            stock_id: null,
            mandatory_contribution_id: null,
            stock_subscription_id: null,
          },
        ],
      });
      expect(result.pagination).toEqual(mockResponse.pagination);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getOperationsQuery.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });
    });

    it('should pass filters to query handler', async () => {
      const mockResponse: PaginatedResponse<OperationResponseDto> = {
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
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        type: OperationType.MONTHLY_PAYMENT,
        page: 1,
        limit: 10,
        order_by: 'ASC',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
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
      const mockResponse: PaginatedResponse<OperationResponseDto> = {
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

      // eslint-disable-next-line @typescript-eslint/unbound-method
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
    it('should return paginated ledger entries in snake_case', async () => {
      const mockResponse: PaginatedResponse<LedgerEntryResponseDto> = {
        data: [
          {
            id: 'entry-1',
            operationId: 'operation-1',
            accountType: CASH_ACCOUNT as AccountType,
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
        order_by: 'DESC',
      });

      expect(result.data[0]).toEqual({
        id: 'entry-1',
        operation_id: 'operation-1',
        account_type: CASH_ACCOUNT,
        amount: 1000,
        created_at: new Date('2024-01-15'),
        description: 'Test entry',
        loan_id: null,
        stock_id: null,
        mandatory_contribution_id: null,
        stock_subscription_id: null,
      });
      expect(result.pagination).toEqual(mockResponse.pagination);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getLedgerEntriesQuery.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        orderBy: 'DESC',
      });
    });

    it('should pass filters to query handler', async () => {
      const mockResponse: PaginatedResponse<LedgerEntryResponseDto> = {
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
        member_id: 'member-1',
        account_type: CASH_ACCOUNT,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        page: 1,
        limit: 10,
        order_by: 'ASC',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
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
      const mockResponse: PaginatedResponse<LedgerEntryResponseDto> = {
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

      // eslint-disable-next-line @typescript-eslint/unbound-method
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

  describe('getAccountsSummary', () => {
    it('should return accounts summary in snake_case', async () => {
      const mockResponse: GetAccountsSummaryResponseDto = {
        accounts: [
          {
            accountType: CASH_ACCOUNT as AccountType,
            accountName: 'Efectivo',
            totalBalance: 1000,
            totalDebits: 1500,
            totalCredits: 500,
            entriesCount: 5,
            hasMoreEntries: false,
            entries: [
              {
                id: 'entry-1',
                operationId: 'op-1',
                accountType: CASH_ACCOUNT as AccountType,
                amount: 100,
                createdAt: new Date('2024-01-15'),
                description: 'Test entry',
                loanId: null,
                stockId: null,
                mandatoryContributionId: null,
                stockSubscriptionId: null,
                operationType: OperationType.MONTHLY_PAYMENT,
                operationDate: new Date('2024-01-15'),
              },
            ],
          },
        ],
        summary: {
          totalAccounts: 1,
          totalDebits: 1500,
          totalCredits: 500,
          netBalance: 1000,
        },
        metadata: {
          queryDate: new Date('2024-01-15'),
          entriesLimit: 10,
        },
      };

      getAccountsSummaryQuery.execute.mockResolvedValue(mockResponse);

      const result = await controller.getAccountsSummary({
        entries_limit: 10,
      });

      expect(result.accounts[0]).toEqual({
        account_type: CASH_ACCOUNT,
        account_name: 'Efectivo',
        total_balance: 1000,
        total_debits: 1500,
        total_credits: 500,
        entries_count: 5,
        has_more_entries: false,
        entries: [
          {
            id: 'entry-1',
            operation_id: 'op-1',
            account_type: CASH_ACCOUNT,
            amount: 100,
            created_at: new Date('2024-01-15'),
            description: 'Test entry',
            loan_id: null,
            stock_id: null,
            mandatory_contribution_id: null,
            stock_subscription_id: null,
            operation_type: OperationType.MONTHLY_PAYMENT,
            operation_date: new Date('2024-01-15'),
          },
        ],
      });
      expect(result.summary).toEqual({
        total_accounts: 1,
        total_debits: 1500,
        total_credits: 500,
        net_balance: 1000,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getAccountsSummaryQuery.execute).toHaveBeenCalledWith({
        entriesLimit: 10,
        startDate: undefined,
        endDate: undefined,
        accountTypes: undefined,
        includeZeroBalance: undefined,
      });
    });

    it('should pass filters to query handler', async () => {
      const mockResponse: GetAccountsSummaryResponseDto = {
        accounts: [],
        summary: {
          totalAccounts: 0,
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
        },
        metadata: {
          queryDate: new Date('2024-01-15'),
          entriesLimit: 5,
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          },
        },
      };

      getAccountsSummaryQuery.execute.mockResolvedValue(mockResponse);

      await controller.getAccountsSummary({
        entries_limit: 5,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        account_types: [CASH_ACCOUNT],
        include_zero_balance: true,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getAccountsSummaryQuery.execute).toHaveBeenCalledWith({
        entriesLimit: 5,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        accountTypes: [CASH_ACCOUNT],
        includeZeroBalance: true,
      });
    });
  });
});
