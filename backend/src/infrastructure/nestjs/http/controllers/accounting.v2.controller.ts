import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { GetOperationsQueryHandler } from '@application/queries/accounting/get-operations.query-handler';
import { GetLedgerEntriesQueryHandler } from '@application/queries/accounting/get-ledger-entries.query-handler';
import { GetAccountsSummaryQueryHandler } from '@application/queries/accounting/get-accounts-summary.query-handler';
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

@ApiTags('Accounting V2')
@Controller('v2/accounting')
export class AccountingV2Controller {
  constructor(
    private readonly getOperationsQuery: GetOperationsQueryHandler,
    private readonly getLedgerEntriesQuery: GetLedgerEntriesQueryHandler,
    private readonly getAccountsSummaryQuery: GetAccountsSummaryQueryHandler,
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
      memberId: query.memberId,
      meetingId: query.meetingId,
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type,
      page: query.page,
      limit: query.limit,
      orderBy: query.orderBy,
    };

    const result = await this.getOperationsQuery.execute(dto);
    return result as PaginatedResponseHttpDto<OperationResponseHttpDto>;
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
      memberId: query.memberId,
      accountType: query.accountType,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
      orderBy: query.orderBy,
    };

    const result = await this.getLedgerEntriesQuery.execute(dto);
    return result as PaginatedResponseHttpDto<LedgerEntryResponseHttpDto>;
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
      entriesLimit: query.entriesLimit,
      startDate: query.startDate,
      endDate: query.endDate,
      accountTypes: query.accountTypes,
      includeZeroBalance: query.includeZeroBalance,
    };

    const result = await this.getAccountsSummaryQuery.execute(dto);
    return result as GetAccountsSummaryResponseHttpDto;
  }
}

