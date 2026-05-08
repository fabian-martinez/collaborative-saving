import { Test, TestingModule } from '@nestjs/testing';
import { AccountingV2Controller } from './accounting.v2.controller';
import { GetOperationsQueryHandler } from '@application/queries/accounting/get-operations.query-handler';
import { GetLedgerEntriesQueryHandler } from '@application/queries/accounting/get-ledger-entries.query-handler';
import { GetAccountsSummaryQueryHandler } from '@application/queries/accounting/get-accounts-summary.query-handler';
import { GetOperationByIdQueryHandler } from '@application/queries/accounting/get-operation-by-id.query-handler';
import { GetLedgerEntryByIdQueryHandler } from '@application/queries/accounting/get-ledger-entry-by-id.query-handler';
import { OperationType } from '@domain/enums/operation-type.enum';
import { CASH_ACCOUNT, AccountType } from '@domain/constants/account-types';
import { PaginatedResponse } from '@application/dto/accounting/paginated-response.dto';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';
import { OperationResponseDto } from '@application/dto/accounting/operation-response.dto';
import { GetAccountsSummaryResponseDto } from '@application/dto/accounting/get-accounts-summary-response.dto';
import { OperationNotFoundException } from '@application/exceptions/operation-not-found.exception';
import { LedgerEntryNotFoundException } from '@application/exceptions/ledger-entry-not-found.exception';
import { HttpException } from '@nestjs/common';

describe('AccountingV2Controller', () => {
  let controller: AccountingV2Controller;
  let getOperationsQuery: jest.Mocked<GetOperationsQueryHandler>;
  let getLedgerEntriesQuery: jest.Mocked<GetLedgerEntriesQueryHandler>;
  let getAccountsSummaryQuery: jest.Mocked<GetAccountsSummaryQueryHandler>;
  let getOperationByIdQuery: jest.Mocked<GetOperationByIdQueryHandler>;
  let getLedgerEntryByIdQuery: jest.Mocked<GetLedgerEntryByIdQueryHandler>;

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
        {
          provide: GetOperationByIdQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetLedgerEntryByIdQueryHandler,
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
    getOperationByIdQuery = module.get(GetOperationByIdQueryHandler);
    getLedgerEntryByIdQuery = module.get(GetLedgerEntryByIdQueryHandler);
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
                accountType: CASH_ACCOUNT,
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
            accountType: CASH_ACCOUNT,
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
                accountType: CASH_ACCOUNT,
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

  describe('getOperationById', () => {
    it('should return operation with entries in snake_case', async () => {
      const operationId = 'op-1';
      const mockOperation: OperationResponseDto = {
        id: operationId,
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Test operation',
        entries: [
          {
            id: 'entry-1',
            operationId: operationId,
            accountType: CASH_ACCOUNT,
            amount: 100,
            createdAt: new Date('2024-01-15'),
            description: 'Cash entry',
            loanId: null,
            stockId: null,
            mandatoryContributionId: null,
            stockSubscriptionId: null,
          },
          {
            id: 'entry-2',
            operationId: operationId,
            accountType: CASH_ACCOUNT,
            amount: 50,
            createdAt: new Date('2024-01-15'),
            description: 'Another cash entry',
            loanId: null,
            stockId: null,
            mandatoryContributionId: null,
            stockSubscriptionId: null,
          },
        ],
      };

      getOperationByIdQuery.execute.mockResolvedValue(mockOperation);

      const result = await controller.getOperationById(operationId);

      expect(result).toEqual({
        id: operationId,
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Test operation',
        total_amount: 150, // 100 + 50 from CASH_ACCOUNT entries
        entries: [
          {
            id: 'entry-1',
            operation_id: operationId,
            account_type: CASH_ACCOUNT,
            amount: 100,
            created_at: new Date('2024-01-15'),
            description: 'Cash entry',
            loan_id: null,
            stock_id: null,
            mandatory_contribution_id: null,
            stock_subscription_id: null,
          },
          {
            id: 'entry-2',
            operation_id: operationId,
            account_type: CASH_ACCOUNT,
            amount: 50,
            created_at: new Date('2024-01-15'),
            description: 'Another cash entry',
            loan_id: null,
            stock_id: null,
            mandatory_contribution_id: null,
            stock_subscription_id: null,
          },
        ],
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getOperationByIdQuery.execute).toHaveBeenCalledWith(operationId);
    });

    it('should return 404 when operation does not exist', async () => {
      const operationId = 'non-existent-op';
      const error = new OperationNotFoundException(operationId);

      getOperationByIdQuery.execute.mockRejectedValue(error);

      await expect(controller.getOperationById(operationId)).rejects.toThrow(
        'Operation with ID non-existent-op not found',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getOperationByIdQuery.execute).toHaveBeenCalledWith(operationId);
    });

    it('should calculate total_amount only from positive CASH_ACCOUNT entries', async () => {
      const operationId = 'op-1';
      const mockOperation: OperationResponseDto = {
        id: operationId,
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Test operation',
        entries: [
          {
            id: 'entry-1',
            operationId: operationId,
            accountType: CASH_ACCOUNT,
            amount: 100,
            createdAt: new Date('2024-01-15'),
            description: 'Cash entry',
            loanId: null,
            stockId: null,
            mandatoryContributionId: null,
            stockSubscriptionId: null,
          },
          {
            id: 'entry-2',
            operationId: operationId,
            accountType: CASH_ACCOUNT,
            amount: -50, // Negative amount should be excluded
            createdAt: new Date('2024-01-15'),
            description: 'Negative cash entry',
            loanId: null,
            stockId: null,
            mandatoryContributionId: null,
            stockSubscriptionId: null,
          },
          {
            id: 'entry-3',
            operationId: operationId,
            accountType: 'LOANS_RECEIVABLE', // Non-CASH account should be excluded
            amount: 200,
            createdAt: new Date('2024-01-15'),
            description: 'Loan entry',
            loanId: null,
            stockId: null,
            mandatoryContributionId: null,
            stockSubscriptionId: null,
          },
        ],
      };

      getOperationByIdQuery.execute.mockResolvedValue(mockOperation);

      const result = await controller.getOperationById(operationId);

      expect(result.total_amount).toBe(100); // Only positive CASH_ACCOUNT entry
    });
  });

  describe('getLedgerEntryById', () => {
    it('should return ledger entry in snake_case', async () => {
      const entryId = 'entry-1';
      const mockEntry: LedgerEntryResponseDto = {
        id: entryId,
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
        createdAt: new Date('2024-01-15'),
        description: 'Test entry',
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      };

      getLedgerEntryByIdQuery.execute.mockResolvedValue(mockEntry);

      const result = await controller.getLedgerEntryById(entryId);

      expect(result).toEqual({
        id: entryId,
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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getLedgerEntryByIdQuery.execute).toHaveBeenCalledWith(entryId);
    });

    it('should return 404 when ledger entry does not exist', async () => {
      const entryId = 'non-existent-entry';
      const error = new LedgerEntryNotFoundException(entryId);

      getLedgerEntryByIdQuery.execute.mockRejectedValue(error);

      await expect(controller.getLedgerEntryById(entryId)).rejects.toThrow(
        'LedgerEntry with ID non-existent-entry not found',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(getLedgerEntryByIdQuery.execute).toHaveBeenCalledWith(entryId);
    });

    it('should return ledger entry with all optional fields', async () => {
      const entryId = 'entry-1';
      const mockEntry: LedgerEntryResponseDto = {
        id: entryId,
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
        createdAt: new Date('2024-01-15'),
        description: 'Test entry with relationships',
        loanId: 'loan-1',
        stockId: 'stock-1',
        mandatoryContributionId: 'contribution-1',
        stockSubscriptionId: 'subscription-1',
      };

      getLedgerEntryByIdQuery.execute.mockResolvedValue(mockEntry);

      const result = await controller.getLedgerEntryById(entryId);

      expect(result).toEqual({
        id: entryId,
        operation_id: 'operation-1',
        account_type: CASH_ACCOUNT,
        amount: 1000,
        created_at: new Date('2024-01-15'),
        description: 'Test entry with relationships',
        loan_id: 'loan-1',
        stock_id: 'stock-1',
        mandatory_contribution_id: 'contribution-1',
        stock_subscription_id: 'subscription-1',
      });
    });
  });
});
