import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MemberRole } from '@domain/enums/member-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { OpenMeetingUseCase } from '@application/use-cases/meetings/open-meeting.use-case';
import { CloseMeetingUseCase } from '@application/use-cases/meetings/close-meeting.use-case';
import { GetMeetingMonthlyPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-monthly-payments.query-handler';
import { GetMeetingPurchasesQueryHandler } from '@application/queries/meetings/get-meeting-purchases.query-handler';
import { GetMeetingStockTransfersQueryHandler } from '@application/queries/meetings/get-meeting-stock-transfers.query-handler';
import { GetMeetingStockExchangesQueryHandler } from '@application/queries/meetings/get-meeting-stock-exchanges.query-handler';
import { GetMeetingStockLoanPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-stock-loan-payments.query-handler';
import { GetMeetingsQueryHandler } from '@application/queries/meetings/get-meetings.query-handler';
import { GetMeetingQueryHandler } from '@application/queries/meetings/get-meeting.query-handler';
import { GetActiveMeetingQueryHandler } from '@application/queries/meetings/get-active-meeting.query-handler';
import { GetRevaluationQueryHandler } from '@application/queries/meetings/get-revaluation.query-handler';
import { GetDetailedMeetingSummaryQueryHandler } from '@application/queries/meetings/get-detailed-meeting-summary.query-handler';
import { RecordRevaluationUseCase } from '@application/use-cases/meetings/record-revaluation.use-case';
import { OpenMeetingHttpDto } from '../dto/open-meeting-http.dto';
import { CloseMeetingHttpDto } from '../dto/close-meeting-http.dto';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { OpenMeetingResponseHttpDto } from '../dto/open-meeting-response-http.dto';
import { OperationResponseHttpDto } from '../dto/operation-response-http.dto';
import { DetailedMeetingSummaryHttpDto } from '../dto/detailed-meeting-summary-http.dto';
import { DetailedMeetingSummaryDto } from '@application/dto/meetings/detailed-meeting-summary.dto';
import { OperationResponseDto } from '@application/dto/meetings/operation-response.dto';
import { RevaluationResponseHttpDto } from '../dto/revaluation-response-http.dto';
import { RevaluationResultDto } from '@application/dto/meetings/revaluation-result.dto';
import { IncludeSummaryQueryDto } from '../dto/include-summary-query.dto';
import { GetDisbursementPlanPreviewQueryHandler } from '@application/queries/meetings/get-disbursement-plan-preview.query-handler';
import { ExecuteDisbursementPlanUseCase } from '@application/use-cases/meetings/execute-disbursement-plan.use-case';
import { DisbursementPlanPreviewDto } from '@application/dto/meetings/disbursement-plan-preview.dto';
import { ExecuteDisbursementPlanDto } from '@application/dto/meetings/execute-disbursement-plan.dto';
import { ExecuteDisbursementPlanResponseDto } from '@application/dto/meetings/execute-disbursement-plan-response.dto';
import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import { DisbursementPlanPreviewResponseHttpDto } from '../dto/meetings/disbursement-plan-preview-http.dto';
import { ExecuteDisbursementPlanHttpDto } from '../dto/meetings/execute-disbursement-plan-http.dto';
import { ExecuteDisbursementPlanResponseHttpDto } from '../dto/meetings/execute-disbursement-plan-response-http.dto';
import {
  DisbursementPlanItemHttpDto,
  DisbursementTypeHttp,
} from '../dto/meetings/disbursement-plan-item-http.dto';

@ApiTags('Meetings V2')
@Controller('v2/meetings')
export class MeetingsV2Controller {
  private readonly logger = new Logger(MeetingsV2Controller.name);

  constructor(
    private readonly openMeetingUseCase: OpenMeetingUseCase,
    private readonly closeMeetingUseCase: CloseMeetingUseCase,
    private readonly getMeetingMonthlyPaymentsQuery: GetMeetingMonthlyPaymentsQueryHandler,
    private readonly getMeetingPurchasesQuery: GetMeetingPurchasesQueryHandler,
    private readonly getMeetingStockTransfersQuery: GetMeetingStockTransfersQueryHandler,
    private readonly getMeetingStockExchangesQuery: GetMeetingStockExchangesQueryHandler,
    private readonly getMeetingStockLoanPaymentsQuery: GetMeetingStockLoanPaymentsQueryHandler,
    private readonly getMeetingsQuery: GetMeetingsQueryHandler,
    private readonly getMeetingQuery: GetMeetingQueryHandler,
    private readonly getActiveMeetingQuery: GetActiveMeetingQueryHandler,
    private readonly getRevaluationQuery: GetRevaluationQueryHandler,
    private readonly recordRevaluationUseCase: RecordRevaluationUseCase,
    private readonly getDisbursementPlanPreviewQuery: GetDisbursementPlanPreviewQueryHandler,
    private readonly executeDisbursementPlanUseCase: ExecuteDisbursementPlanUseCase,
    private readonly getDetailedMeetingSummaryQuery: GetDetailedMeetingSummaryQueryHandler,
  ) {}

  @Post()
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Open a new meeting',
    description:
      'Creates a new active meeting. Only one active meeting can exist at a time.',
  })
  @ApiBody({ type: OpenMeetingHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Meeting opened successfully',
    type: MeetingResponseDto,
    examples: {
      example: {
        summary: 'Opened meeting',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          date: '2024-01-15T10:30:00Z',
          status: 'active',
          notes: 'Reunión mensual de enero',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - An active meeting already exists or invalid data',
  })
  async open(
    @Body() dto: OpenMeetingHttpDto,
  ): Promise<OpenMeetingResponseHttpDto> {
    const openDto = {
      date: dto.date,
      notes: dto.notes,
    };
    const result = await this.openMeetingUseCase.execute(openDto);
    return this.mapMeetingToHttp(result);
  }

  @Patch(':id/close')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Close a meeting',
    description:
      'Closes an active meeting. Once closed, no new operations can be added. Any remaining CASH will be moved to ACCUMULATED_SURPLUS.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: CloseMeetingHttpDto,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Meeting closed successfully',
    type: MeetingResponseDto,
    examples: {
      example: {
        summary: 'Closed meeting',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          date: '2024-01-15T10:30:00Z',
          status: 'closed',
          notes: 'Reunión mensual de enero',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - Meeting is already closed or CASH balance is negative',
  })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: CloseMeetingHttpDto,
  ): Promise<OpenMeetingResponseHttpDto> {
    const result = await this.closeMeetingUseCase.execute({
      meetingId: id,
      authorizedBy: body?.authorizedBy,
    });
    return this.mapMeetingToHttp(result);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all meetings',
    description:
      'Returns all meetings ordered by date descending (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all meetings, ordered by date descending',
    type: [OpenMeetingResponseHttpDto],
  })
  async findAll(): Promise<OpenMeetingResponseHttpDto[]> {
    const meetings = await this.getMeetingsQuery.execute();
    return meetings.map((m) => this.mapMeetingToHttp(m));
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get the active meeting',
    description:
      'Returns the currently active meeting with summary included by default. This is a specialization of GET /v2/meetings/:id.',
  })
  @ApiResponse({
    status: 200,
    description: 'The active meeting with summary',
    type: OpenMeetingResponseHttpDto,
    examples: {
      example: {
        summary: 'Active meeting with summary',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          date: '2024-01-15T10:30:00Z',
          status: 'active',
          notes: 'Reunión mensual de enero',
          created_at: '2024-01-15T10:30:00Z',
          summary: {
            total_cash: 150000.0,
            total_interest: 5000.0,
            total_loans: 20000.0,
            total_collected: 145000.0,
            total_dividends: 10000.0,
            total_stock_investment: 30000.0,
            final_cash_balance: 120000.0,
            total_disbursed: 30000.0,
            participants_count: 15,
            duration: '2h 30m',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No active meeting found',
  })
  async getActive(): Promise<OpenMeetingResponseHttpDto> {
    const meeting = await this.getActiveMeetingQuery.execute();
    return this.mapMeetingToHttp(meeting);
  }

  @Get(':id/summary')
  @ApiOperation({
    summary: 'Get detailed meeting summary for closed meeting dashboard',
    description:
      'Returns comprehensive summary with collections, disbursements, and metrics. Designed for displaying detailed information on a closed meeting dashboard.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed meeting summary retrieved successfully',
    type: DetailedMeetingSummaryHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getDetailedSummary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DetailedMeetingSummaryHttpDto> {
    const result = await this.getDetailedMeetingSummaryQuery.execute(id);
    return this.mapDetailedSummaryToHttp(result);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a meeting by ID',
    description:
      'Returns a specific meeting by its unique identifier. Optionally includes summary with calculated fields when includeSummary=true.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Meeting retrieved successfully',
    type: OpenMeetingResponseHttpDto,
    examples: {
      example: {
        summary: 'Meeting details',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          date: '2024-01-15T10:30:00Z',
          status: 'active',
          notes: 'Reunión mensual de enero',
          created_at: '2024-01-15T10:30:00Z',
        },
      },
      withSummary: {
        summary: 'Meeting details with summary',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          date: '2024-01-15T10:30:00Z',
          status: 'active',
          notes: 'Reunión mensual de enero',
          created_at: '2024-01-15T10:30:00Z',
          summary: {
            total_cash: 150000.0,
            total_interest: 5000.0,
            total_loans: 20000.0,
            total_collected: 145000.0,
            total_dividends: 10000.0,
            total_stock_investment: 30000.0,
            final_cash_balance: 120000.0,
            total_disbursed: 30000.0,
            participants_count: 15,
            duration: '2h 30m',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: IncludeSummaryQueryDto,
  ): Promise<OpenMeetingResponseHttpDto> {
    const includeSummary = query.include_summary === true;
    const meeting = await this.getMeetingQuery.execute(id, includeSummary);
    return this.mapMeetingToHttp(meeting);
  }

  @Get(':id/payments')
  @ApiOperation({
    summary: 'Get monthly payments for a meeting',
    description:
      'Returns all monthly payment operations for a specific meeting.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly payments retrieved successfully',
    type: [OperationResponseHttpDto],
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getMonthlyPayments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OperationResponseHttpDto[]> {
    const payments = await this.getMeetingMonthlyPaymentsQuery.execute(id);
    return payments.map((p) => this.mapOperationToHttp(p));
  }

  @Get(':id/purchases')
  @ApiOperation({
    summary: 'Get stock purchases for a meeting',
    description:
      'Returns all stock purchase operations for a specific meeting.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock purchases retrieved successfully',
    type: [OperationResponseHttpDto],
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getPurchases(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OperationResponseHttpDto[]> {
    const purchases = await this.getMeetingPurchasesQuery.execute(id);
    return purchases.map((p) => this.mapOperationToHttp(p));
  }

  @Get(':id/transfers')
  @ApiOperation({
    summary: 'Get stock transfers for a meeting',
    description:
      'Returns all stock transfer operations for a specific meeting.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock transfers retrieved successfully',
    type: [OperationResponseHttpDto],
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getTransfers(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OperationResponseHttpDto[]> {
    const transfers = await this.getMeetingStockTransfersQuery.execute(id);
    return transfers.map((t) => this.mapOperationToHttp(t));
  }

  @Get(':id/exchanges')
  @ApiOperation({
    summary: 'Get stock exchanges for a meeting',
    description:
      'Returns all stock exchange operations for a specific meeting.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock exchanges retrieved successfully',
    type: [OperationResponseHttpDto],
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getExchanges(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OperationResponseHttpDto[]> {
    const exchanges = await this.getMeetingStockExchangesQuery.execute(id);
    return exchanges.map((e) => this.mapOperationToHttp(e));
  }

  @Get(':id/stock-loan-payments')
  @ApiOperation({
    summary: 'Get stock loan payments for a meeting',
    description:
      'Returns all stock loan payment operations for a specific meeting.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock loan payments retrieved successfully',
    type: [OperationResponseHttpDto],
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getStockLoanPayments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OperationResponseHttpDto[]> {
    const payments = await this.getMeetingStockLoanPaymentsQuery.execute(id);
    return payments.map((p) => this.mapOperationToHttp(p));
  }

  private mapMeetingToHttp(
    m: MeetingResponseDto & {
      summary?: {
        totalCash?: number;
        totalInterest?: number;
        totalLoans?: number;
        totalCollected?: number;
        totalDividends?: number;
        totalStockInvestment?: number;
        finalCashBalance?: number;
        totalDisbursed?: number;
        participantsCount?: number;
        duration?: string;
      };
    },
  ): OpenMeetingResponseHttpDto {
    const result: OpenMeetingResponseHttpDto = {
      id: m.id,
      date: m.date,
      status: m.status,
      notes: m.notes,
      created_at: m.createdAt,
    };

    if (m.summary) {
      result.summary = {
        total_cash: m.summary.totalCash,
        total_interest: m.summary.totalInterest,
        total_loans: m.summary.totalLoans,
        total_collected: m.summary.totalCollected,
        total_dividends: m.summary.totalDividends,
        total_stock_investment: m.summary.totalStockInvestment,
        final_cash_balance: m.summary.finalCashBalance,
        total_disbursed: m.summary.totalDisbursed,
        participants_count: m.summary.participantsCount,
        duration: m.summary.duration,
      };
    }

    return result;
  }

  private mapDetailedSummaryToHttp(
    dto: DetailedMeetingSummaryDto,
  ): DetailedMeetingSummaryHttpDto {
    return {
      meeting: {
        id: dto.meeting.id,
        date: dto.meeting.date.toISOString(),
        status: dto.meeting.status,
        notes: dto.meeting.notes,
      },
      summary: {
        total_collected: dto.summary.totalCollected,
        total_disbursed: dto.summary.totalDisbursed,
        share_value: dto.summary.shareValue,
        participants: dto.summary.participants,
      },
      collections: {
        member_contributions: {
          count: dto.collections.memberContributions.count,
          amount: dto.collections.memberContributions.amount,
        },
        loan_payments: {
          count: dto.collections.loanPayments.count,
          amount: dto.collections.loanPayments.amount,
        },
        interest_collected: dto.collections.interestCollected,
        fees_collected: dto.collections.feesCollected,
      },
      disbursements: {
        new_loans: {
          count: dto.disbursements.newLoans.count,
          amount: dto.disbursements.newLoans.amount,
        },
        stock_liquidations: {
          count: dto.disbursements.stockLiquidations.count,
          amount: dto.disbursements.stockLiquidations.amount,
        },
        dividend_payments: {
          count: dto.disbursements.dividendPayments.count,
          amount: dto.disbursements.dividendPayments.amount,
        },
      },
      metrics: {
        attendance: {
          current: dto.metrics.attendance.current,
          expected: dto.metrics.attendance.expected,
          percentage: dto.metrics.attendance.percentage,
        },
        revaluation: dto.metrics.revaluation
          ? {
              previous_value: dto.metrics.revaluation.previousValue,
              new_value: dto.metrics.revaluation.newValue,
              percentage: dto.metrics.revaluation.percentage,
            }
          : null,
        payments_up_to_date: dto.metrics.paymentsUpToDate,
        overdue_payments: dto.metrics.overduePayments,
      },
    };
  }

  private mapOperationToHttp(
    operation: OperationResponseDto,
  ): OperationResponseHttpDto {
    return {
      id: operation.id,
      member_id: operation.memberId,
      meeting_id: operation.meetingId,
      type: operation.type,
      date: operation.date,
      description: operation.description ?? null,
      total_amount: operation.totalAmount ?? 0,
      entries: [], // Meetings operations don't include ledger entries
    };
  }

  @Get(':id/revaluation')
  @ApiOperation({
    summary: 'Get revaluation preview or executed result',
    description:
      "Returns preview if not executed, or executed result if already executed. Includes status field to indicate if it's a preview or executed result.",
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Revaluation data retrieved successfully',
    type: RevaluationResponseHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getRevaluation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RevaluationResponseHttpDto> {
    const result = await this.getRevaluationQuery.execute(id);
    return this.mapRevaluationToHttp(result);
  }

  @Patch(':id/revaluation/confirm')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Confirm and execute revaluation',
    description:
      'Confirms and executes the revaluation for the meeting. This operation is idempotent - if already executed, returns the existing result.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Revaluation confirmed and executed successfully',
    type: RevaluationResponseHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid revaluation data or meeting state',
  })
  async confirmRevaluation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RevaluationResponseHttpDto> {
    const result = await this.recordRevaluationUseCase.execute({
      meetingId: id,
    });
    return this.mapRevaluationToHttp(result);
  }

  private mapRevaluationToHttp(
    result: RevaluationResultDto,
  ): RevaluationResponseHttpDto {
    return {
      total_contributions: result.totalContributions,
      total_interest: result.totalInterest,
      total_to_distribute: result.totalToDistribute,
      details: result.details.map((detail) => ({
        stock_id: detail.stockId,
        type: detail.type,
        is_guaranteed: detail.isGuaranteed,
        total_shares: detail.totalShares,
        previous_value: detail.previousValue,
        growth_from_contributions: detail.growthFromContributions,
        growth_from_interest: detail.growthFromInterest,
        total_growth_per_share: detail.totalGrowthPerShare,
        estimated_growth_from_contributions:
          detail.estimatedGrowthFromContributions,
        new_value: detail.newValue,
        dividends_generated: detail.dividendsGenerated,
      })),
      total_mandatory_contributions: result.totalMandatoryContributions,
      mandatory_contributions_by_type: result.mandatoryContributionsByType?.map(
        (m) => ({
          mandatory_contribution_id: m.mandatoryContributionId,
          total: m.total,
        }),
      ),
      status: result.status,
      executed_at: result.executedAt,
      operation_id: result.operationId,
    };
  }

  @Get(':id/disbursement-plan')
  @ApiOperation({
    summary: 'Get disbursement plan preview',
    description:
      'Returns a preview of pending disbursements for a meeting, including available cash and total to disburse. Does not validate if available cash >= total requested.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Disbursement plan preview retrieved successfully',
    type: DisbursementPlanPreviewResponseHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getDisbursementPlanPreview(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DisbursementPlanPreviewResponseHttpDto> {
    const result = await this.getDisbursementPlanPreviewQuery.execute(id);
    this.logger.log(
      `Disbursement plan preview for meeting ${id}: ${result.plan.length} items`,
    );
    const mappedResult = this.mapDisbursementPlanPreviewToHttp(result);
    this.logger.log(
      `Mapped result - First 3 items types: ${mappedResult.plan
        .slice(0, 3)
        .map((item) => `${item.type} (${typeof item.type})`)
        .join(', ')}`,
    );
    return mappedResult;
  }

  @Post(':id/disbursement-plan')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Execute disbursement plan',
    description:
      'Executes a disbursement plan for a meeting. Validates that available cash >= total requested before executing. All disbursements are executed atomically in a single transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: ExecuteDisbursementPlanHttpDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Disbursement plan executed successfully',
    type: ExecuteDisbursementPlanResponseHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - Invalid disbursement plan, insufficient cash, or invalid meeting state',
  })
  async executeDisbursementPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteDisbursementPlanHttpDto,
  ): Promise<ExecuteDisbursementPlanResponseHttpDto> {
    const executeDto: ExecuteDisbursementPlanDto = {
      meetingId: id,
      plan: dto.plan_items.map((item) =>
        this.mapDisbursementPlanItemFromHttp(item),
      ),
    };
    const result =
      await this.executeDisbursementPlanUseCase.execute(executeDto);
    return this.mapExecuteDisbursementPlanResponseToHttp(result);
  }

  private mapDisbursementPlanPreviewToHttp(
    dto: DisbursementPlanPreviewDto,
  ): DisbursementPlanPreviewResponseHttpDto {
    const mappedPlan = dto.plan.map((item) =>
      this.mapDisbursementPlanItemToHttp(item),
    );
    this.logger.log(
      `Mapped ${mappedPlan.length} items. Sample types: ${mappedPlan
        .slice(0, 5)
        .map((i) => i.type)
        .join(', ')}`,
    );
    return {
      plan: mappedPlan,
      available_cash: dto.availableCash,
      total_to_disburse: dto.totalToDisburse,
    };
  }

  private mapDisbursementPlanItemToHttp(
    item: DisbursementPlanItemDto,
  ): DisbursementPlanItemHttpDto {
    const mappedType = this.mapDisbursementTypeToHttp(item.type);
    // El tipo ya es un string ('dividend', 'withdrawal', etc.)
    this.logger.debug(
      `Mapping item: originalType=${item.type}, mappedType=${mappedType}, typeOf=${typeof mappedType}, pendingMemberPaymentId=${item.pendingMemberPaymentId}`,
    );
    const result: DisbursementPlanItemHttpDto = {
      member_id: item.memberId,
      type: mappedType,
      amount: item.amount,
    };
    this.logger.debug(
      `Result type: ${result.type}, typeOf=${typeof result.type}`,
    );

    if (item.status) result.status = item.status;
    if (item.notes) result.notes = item.notes;
    if (item.loanId) result.loan_id = item.loanId;
    if (item.stockSubscriptionId)
      result.stock_subscription_id = item.stockSubscriptionId;
    // Siempre asignar pendingMemberPaymentId si existe
    if (item.pendingMemberPaymentId) {
      result.pending_member_payment_id = item.pendingMemberPaymentId;
      this.logger.debug(
        `Assigned pending_member_payment_id: ${item.pendingMemberPaymentId}`,
      );
    } else {
      this.logger.warn(
        `Missing pendingMemberPaymentId for item type=${item.type}, memberId=${item.memberId}, amount=${item.amount}`,
      );
    }
    if (item.disbursementStockRequest) {
      const stockRequest = item.disbursementStockRequest;
      result.disbursement_stock_request = {
        stock_id: stockRequest.stockId,
        stock_withdrawal_quantity: stockRequest.stockWithdrawalQuantity,
      };
    }
    if (item.newLoanRequest) {
      const loanRequest = item.newLoanRequest;
      result.new_loan_request = {
        member_id: loanRequest.memberId,
        amount: loanRequest.amount,
        loan_type: loanRequest.loanType,
        approved_amount: loanRequest.approvedAmount,
        monthly_payment_amount: loanRequest.monthlyPaymentAmount,
        interest_rate: loanRequest.interestRate,
        notes: loanRequest.notes,
      };
    }

    return result;
  }

  private mapDisbursementPlanItemFromHttp(
    item: DisbursementPlanItemHttpDto,
  ): DisbursementPlanItemDto {
    const result: DisbursementPlanItemDto = {
      memberId: item.member_id,
      type: this.mapDisbursementTypeFromHttp(item.type),
      amount: item.amount,
    };

    if (item.status) result.status = item.status;
    if (item.notes) result.notes = item.notes;
    if (item.loan_id) result.loanId = item.loan_id;
    if (item.stock_subscription_id)
      result.stockSubscriptionId = item.stock_subscription_id;
    if (item.pending_member_payment_id)
      result.pendingMemberPaymentId = item.pending_member_payment_id;
    if (item.disbursement_stock_request) {
      result.disbursementStockRequest = {
        stockId: item.disbursement_stock_request.stock_id,
        stockWithdrawalQuantity:
          item.disbursement_stock_request.stock_withdrawal_quantity,
      };
    }
    if (item.new_loan_request) {
      result.newLoanRequest = {
        memberId: item.new_loan_request.member_id,
        amount: item.new_loan_request.amount,
        loanType: item.new_loan_request.loan_type,
        approvedAmount: item.new_loan_request.approved_amount,
        monthlyPaymentAmount: item.new_loan_request.monthly_payment_amount,
        interestRate: item.new_loan_request.interest_rate,
        notes: item.new_loan_request.notes,
      };
    }

    return result;
  }

  private mapDisbursementTypeToHttp(
    type: DisbursementType,
  ): DisbursementTypeHttp {
    // Mapear directamente usando el valor del enum (que es string)
    // Devolver el valor del enum DisbursementTypeHttp para asegurar la serialización correcta
    switch (type) {
      case DisbursementType.DIVIDEND:
        return DisbursementTypeHttp.DIVIDEND;
      case DisbursementType.WITHDRAWAL:
        return DisbursementTypeHttp.WITHDRAWAL;
      case DisbursementType.LOAN:
        return DisbursementTypeHttp.LOAN;
      case DisbursementType.OTHER:
        return DisbursementTypeHttp.OTHER;
      default:
        return DisbursementTypeHttp.OTHER;
    }
  }

  private mapDisbursementTypeFromHttp(
    type: DisbursementTypeHttp | string,
  ): DisbursementType {
    const typeMap: Record<DisbursementTypeHttp, DisbursementType> = {
      [DisbursementTypeHttp.DIVIDEND]: DisbursementType.DIVIDEND,
      [DisbursementTypeHttp.WITHDRAWAL]: DisbursementType.WITHDRAWAL,
      [DisbursementTypeHttp.LOAN]: DisbursementType.LOAN,
      [DisbursementTypeHttp.OTHER]: DisbursementType.OTHER,
    };

    const enumType =
      typeof type === 'string' ? (type as DisbursementTypeHttp) : type;

    return typeMap[enumType] ?? DisbursementType.OTHER;
  }

  private mapExecuteDisbursementPlanResponseToHttp(
    dto: ExecuteDisbursementPlanResponseDto,
  ): ExecuteDisbursementPlanResponseHttpDto {
    return {
      success: dto.success,
      processed_items: dto.processedItems,
      total_disbursed: dto.totalDisbursed,
      total_requested: dto.totalRequested,
    };
  }
}
