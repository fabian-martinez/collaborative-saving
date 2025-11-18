import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
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
import { GetMeetingsQueryHandler } from '@application/queries/meetings/get-meetings.query-handler';
import { GetMeetingQueryHandler } from '@application/queries/meetings/get-meeting.query-handler';
import { GetActiveMeetingQueryHandler } from '@application/queries/meetings/get-active-meeting.query-handler';
import { GetRevaluationQueryHandler } from '@application/queries/meetings/get-revaluation.query-handler';
import { RecordRevaluationUseCase } from '@application/use-cases/meetings/record-revaluation.use-case';
import { OpenMeetingHttpDto } from '../dto/open-meeting-http.dto';
import { CloseMeetingHttpDto } from '../dto/close-meeting-http.dto';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { OpenMeetingResponseHttpDto } from '../dto/open-meeting-response-http.dto';
import { OperationResponseHttpDto } from '../dto/operation-response-http.dto';
import { OperationResponseDto } from '@application/dto/meetings/operation-response.dto';
import { RevaluationResponseHttpDto } from '../dto/revaluation-response-http.dto';
import { RevaluationResultDto } from '@application/dto/meetings/revaluation-result.dto';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { IncludeSummaryQueryDto } from '../dto/include-summary-query.dto';

@ApiTags('Meetings V2')
@Controller('v2/meetings')
export class MeetingsV2Controller {
  constructor(
    private readonly openMeetingUseCase: OpenMeetingUseCase,
    private readonly closeMeetingUseCase: CloseMeetingUseCase,
    private readonly getMeetingMonthlyPaymentsQuery: GetMeetingMonthlyPaymentsQueryHandler,
    private readonly getMeetingsQuery: GetMeetingsQueryHandler,
    private readonly getMeetingQuery: GetMeetingQueryHandler,
    private readonly getActiveMeetingQuery: GetActiveMeetingQueryHandler,
    private readonly getRevaluationQuery: GetRevaluationQueryHandler,
    private readonly recordRevaluationUseCase: RecordRevaluationUseCase,
  ) {}

  @Post()
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
    try {
      const openDto = {
        date: dto.date,
        notes: dto.notes,
      };
      const result = await this.openMeetingUseCase.execute(openDto);
      return this.mapMeetingToHttp(result);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/close')
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
    try {
      const result = await this.closeMeetingUseCase.execute({
        meetingId: id,
        authorizedBy: body?.authorizedBy,
      });
      return this.mapMeetingToHttp(result);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    try {
      const meetings = await this.getMeetingsQuery.execute();
      return meetings.map((m) => this.mapMeetingToHttp(m));
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    try {
      const meeting = await this.getActiveMeetingQuery.execute();
      return this.mapMeetingToHttp(meeting);
    } catch (error: unknown) {
      if (error instanceof MeetingNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    try {
      const includeSummary = query.includeSummary === true;
      const meeting = await this.getMeetingQuery.execute(id, includeSummary);
      return this.mapMeetingToHttp(meeting);
    } catch (error: unknown) {
      if (error instanceof MeetingNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    try {
      const payments = await this.getMeetingMonthlyPaymentsQuery.execute(id);
      return payments.map((p) => this.mapOperationToHttp(p));
    } catch (error: unknown) {
      if (error instanceof MeetingNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  private mapOperationToHttp(
    operation: OperationResponseDto,
  ): OperationResponseHttpDto {
    return {
      id: operation.id,
      member_id: operation.memberId,
      meeting_id: operation.meetingId,
      type: operation.type,
      date: operation.date,
      description: operation.description,
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
    try {
      const result = await this.getRevaluationQuery.execute(id);
      return this.mapRevaluationToHttp(result);
    } catch (error: unknown) {
      if (error instanceof MeetingNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/revaluation/confirm')
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
    try {
      const result = await this.recordRevaluationUseCase.execute({
        meetingId: id,
      });
      return this.mapRevaluationToHttp(result);
    } catch (error: unknown) {
      if (error instanceof MeetingNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
}
