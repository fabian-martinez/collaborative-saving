import {
  Controller,
  Get,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { GetOperationsQueryHandler } from '@application/queries/accounting/get-operations.query-handler';
import { GetLedgerEntriesQueryHandler } from '@application/queries/accounting/get-ledger-entries.query-handler';
import { GetAccountsSummaryQueryHandler } from '@application/queries/accounting/get-accounts-summary.query-handler';
import { GetOperationByIdQueryHandler } from '@application/queries/accounting/get-operation-by-id.query-handler';
import { GetLedgerEntryByIdQueryHandler } from '@application/queries/accounting/get-ledger-entry-by-id.query-handler';
import { GetOperationsQueryHttpDto } from '../dto/get-operations-query-http.dto';
import { GetLedgerEntriesQueryHttpDto } from '../dto/get-ledger-entries-query-http.dto';
import { GetAccountsSummaryQueryHttpDto } from '../dto/get-accounts-summary-query-http.dto';
import { OperationResponseHttpDto } from '../dto/operation-response-http.dto';
import { LedgerEntryResponseHttpDto } from '../dto/ledger-entry-response-http.dto';
import { GetAccountsSummaryResponseHttpDto } from '../dto/get-accounts-summary-response-http.dto';
import { PaginatedResponseHttpDto } from '../dto/paginated-response-http.dto';
import { GetOperationsQueryDto } from '@application/dto/accounting/get-operations-query.dto';
import { GetLedgerEntriesQueryDto } from '@application/dto/accounting/get-ledger-entries-query.dto';
import { GetAccountsSummaryQueryDto } from '@application/dto/accounting/get-accounts-summary-query.dto';
import {
  ALL_ACCOUNT_TYPES,
  AccountType,
  CASH_ACCOUNT,
} from '@domain/constants/account-types';

@ApiTags('Accounting V2')
@Controller('v2/accounting')
export class AccountingV2Controller {
  constructor(
    private readonly getOperationsQuery: GetOperationsQueryHandler,
    private readonly getLedgerEntriesQuery: GetLedgerEntriesQueryHandler,
    private readonly getAccountsSummaryQuery: GetAccountsSummaryQueryHandler,
    private readonly getOperationByIdQuery: GetOperationByIdQueryHandler,
    private readonly getLedgerEntryByIdQuery: GetLedgerEntryByIdQueryHandler,
  ) {}

  @Get('operations')
  @ApiOperation({
    summary: 'Get operations with pagination and filters',
    description:
      'Retrieves operations with pagination. Supports filtering by member, meeting, date range, and operation type.',
  })
  @ApiResponse({
    status: 200,
    description: 'Operations retrieved successfully',
    type: PaginatedResponseHttpDto<OperationResponseHttpDto>,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getOperations(
    @Query() query: GetOperationsQueryHttpDto,
  ): Promise<PaginatedResponseHttpDto<OperationResponseHttpDto>> {
    const dto: GetOperationsQueryDto = {
      memberId: query.member_id,
      meetingId: query.meeting_id,
      startDate: query.start_date,
      endDate: query.end_date,
      type: query.type,
      page: query.page,
      limit: query.limit,
      orderBy: query.order_by,
    };

    const result = await this.getOperationsQuery.execute(dto);

    // Map application DTOs (camelCase) to HTTP DTOs (snake_case)
    const httpData: OperationResponseHttpDto[] = result.data.map(
      (operation) => {
        // Calculate total_amount from CASH_ACCOUNT entries with positive amounts
        const totalAmount = operation.entries
          .filter(
            (entry) => entry.accountType === CASH_ACCOUNT && entry.amount > 0,
          )
          .reduce((sum, entry) => sum + entry.amount, 0);

        return {
          id: operation.id,
          member_id: operation.memberId,
          meeting_id: operation.meetingId,
          type: operation.type,
          date: operation.date,
          description: operation.description,
          total_amount: totalAmount,
          entries: operation.entries.map((entry) => ({
            id: entry.id,
            operation_id: entry.operationId,
            account_type: entry.accountType,
            amount: entry.amount,
            created_at: entry.createdAt,
            description: entry.description,
            loan_id: entry.loanId,
            stock_id: entry.stockId,
            mandatory_contribution_id: entry.mandatoryContributionId,
            stock_subscription_id: entry.stockSubscriptionId,
          })),
        };
      },
    );

    return {
      data: httpData,
      pagination: result.pagination,
    };
  }

  @Get('operations/:id')
  @ApiOperation({
    summary: 'Get operation by ID',
    description:
      'Retrieves a specific operation by its unique identifier with all associated ledger entries.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the operation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Operation retrieved successfully',
    type: OperationResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Operation not found',
  })
  async getOperationById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OperationResponseHttpDto> {
    const operation = await this.getOperationByIdQuery.execute(id);

    // Calculate total_amount from CASH_ACCOUNT entries with positive amounts
    const totalAmount = operation.entries
      .filter((entry) => entry.accountType === CASH_ACCOUNT && entry.amount > 0)
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      id: operation.id,
      member_id: operation.memberId,
      meeting_id: operation.meetingId,
      type: operation.type,
      date: operation.date,
      description: operation.description,
      total_amount: totalAmount,
      entries: operation.entries.map((entry) => ({
        id: entry.id,
        operation_id: entry.operationId,
        account_type: entry.accountType,
        amount: entry.amount,
        created_at: entry.createdAt,
        description: entry.description,
        loan_id: entry.loanId,
        stock_id: entry.stockId,
        mandatory_contribution_id: entry.mandatoryContributionId,
        stock_subscription_id: entry.stockSubscriptionId,
      })),
    };
  }

  @Get('ledger-entries')
  @ApiOperation({
    summary: 'Get ledger entries with pagination and filters',
    description:
      'Retrieves ledger entries with pagination. Supports filtering by member, account type, and date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ledger entries retrieved successfully',
    type: PaginatedResponseHttpDto<LedgerEntryResponseHttpDto>,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getLedgerEntries(
    @Query() query: GetLedgerEntriesQueryHttpDto,
  ): Promise<PaginatedResponseHttpDto<LedgerEntryResponseHttpDto>> {
    const dto: GetLedgerEntriesQueryDto = {
      memberId: query.member_id,
      accountType: query.account_type,
      startDate: query.start_date,
      endDate: query.end_date,
      page: query.page,
      limit: query.limit,
      orderBy: query.order_by,
    };

    const result = await this.getLedgerEntriesQuery.execute(dto);

    // Map application DTOs (camelCase) to HTTP DTOs (snake_case)
    const httpData: LedgerEntryResponseHttpDto[] = result.data.map((entry) => ({
      id: entry.id,
      operation_id: entry.operationId,
      account_type: entry.accountType,
      amount: entry.amount,
      created_at: entry.createdAt,
      description: entry.description,
      loan_id: entry.loanId,
      stock_id: entry.stockId,
      mandatory_contribution_id: entry.mandatoryContributionId,
      stock_subscription_id: entry.stockSubscriptionId,
    }));

    return {
      data: httpData,
      pagination: result.pagination,
    };
  }

  @Get('ledger-entries/:id')
  @ApiOperation({
    summary: 'Get ledger entry by ID',
    description: 'Retrieves a specific ledger entry by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the ledger entry',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Ledger entry retrieved successfully',
    type: LedgerEntryResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Ledger entry not found',
  })
  async getLedgerEntryById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LedgerEntryResponseHttpDto> {
    const entry = await this.getLedgerEntryByIdQuery.execute(id);

    return {
      id: entry.id,
      operation_id: entry.operationId,
      account_type: entry.accountType,
      amount: entry.amount,
      created_at: entry.createdAt,
      description: entry.description,
      loan_id: entry.loanId,
      stock_id: entry.stockId,
      mandatory_contribution_id: entry.mandatoryContributionId,
      stock_subscription_id: entry.stockSubscriptionId,
    };
  }

  @Get('accounts-summary')
  @ApiOperation({
    summary: 'Get accounts summary with totals and limited entries',
    description:
      'Retrieves all accounts with their totals (calculated with all entries) and a limited list of recent entries per account for display purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accounts summary retrieved successfully',
    type: GetAccountsSummaryResponseHttpDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAccountsSummary(
    @Query() query: GetAccountsSummaryQueryHttpDto,
  ): Promise<GetAccountsSummaryResponseHttpDto> {
    const dto: GetAccountsSummaryQueryDto = {
      entriesLimit: query.entries_limit,
      startDate: query.start_date,
      endDate: query.end_date,
      accountTypes: query.account_types,
      includeZeroBalance: query.include_zero_balance,
    };

    const result = await this.getAccountsSummaryQuery.execute(dto);

    // Map application DTOs (camelCase) to HTTP DTOs (snake_case)
    const httpAccounts = result.accounts.map((account) => ({
      account_type: account.accountType,
      account_name: account.accountName,
      total_balance: account.totalBalance,
      total_debits: account.totalDebits,
      total_credits: account.totalCredits,
      entries_count: account.entriesCount,
      has_more_entries: account.hasMoreEntries,
      entries: account.entries.map((entry) => ({
        id: entry.id,
        operation_id: entry.operationId,
        account_type: entry.accountType,
        amount: entry.amount,
        created_at: entry.createdAt,
        description: entry.description,
        loan_id: entry.loanId,
        stock_id: entry.stockId,
        mandatory_contribution_id: entry.mandatoryContributionId,
        stock_subscription_id: entry.stockSubscriptionId,
        operation_type: entry.operationType,
        operation_date: entry.operationDate,
      })),
    }));

    return {
      accounts: httpAccounts,
      summary: {
        total_accounts: result.summary.totalAccounts,
        total_debits: result.summary.totalDebits,
        total_credits: result.summary.totalCredits,
        net_balance: result.summary.netBalance,
      },
      metadata: {
        query_date: result.metadata.queryDate,
        date_range: result.metadata.dateRange
          ? {
              start_date: result.metadata.dateRange.startDate,
              end_date: result.metadata.dateRange.endDate,
            }
          : undefined,
        entries_limit: result.metadata.entriesLimit,
      },
    };
  }

  @Get('ledger-entries/account-types')
  @ApiOperation({
    summary: 'Get available account types',
    description:
      'Retrieves all available account types with their labels for filtering ledger entries.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account types retrieved successfully',
  })
  getAccountTypes(): Array<{ value: string; label: string }> {
    const accountNames: Record<AccountType, string> = {
      CASH: 'Caja General',
      LOANS_RECEIVABLE: 'Cartera de Préstamos',
      INVESTMENT_IN_STOCKS: 'Inversión en Acciones',
      DIVIDENDS_PAYABLE: 'Dividendos por Pagar',
      STOCK_CAPITAL: 'Capital Social',
      STOCK_TRANSFER: 'Transferencia de Acciones',
      REVALUATION_SURPLUS: 'Superávit por Revalorización',
      MEMBER_EQUITY: 'Patrimonio del Socio',
      ACCUMULATED_SURPLUS: 'Utilidades Acumuladas',
      INTEREST_INCOME: 'Ingresos por Intereses',
      FEE_INCOME: 'Ingresos por Otros',
      MANDATORY_CONTRIBUTION_INCOME: 'Aportes Obligatorios',
      INSURANCE_INCOME: 'Ingresos por Seguro',
      DIVIDEND_EXPENSE: 'Gastos por Dividendos',
      OTHER_EXPENSES: 'Gastos Administrativos',
      NOVELTY_LOSS: 'Provisión Cartera Incobrable',
    };

    return ALL_ACCOUNT_TYPES.map((accountType) => ({
      value: accountType,
      label: accountNames[accountType] || accountType,
    }));
  }
}
