import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { SimplifiedRecordTransactionsDto } from './dto/simplified-record-transactions.dto';
import { Meeting } from './entities/meeting.entity';
import { Operation } from '../operations/entities/operation.entity';
import { AssetRevaluationService } from '../asset-revaluation/asset-revaluation.service';
import { BuyStockForMemberDto } from '../stocks/dto/buy-stock-for-member.dto';
import {
  ExecuteDisbursementPlanDto,
  DisbursementPlanPreviewResponseDto,
} from './dto/disbursement-plan.dto';
import { WithdrawStockForMemberDto } from './dto/withdraw-stock-for-member.dto';
import {
  MeetingSummaryFieldsDto,
  MEETING_SUMMARY_FIELDS,
} from './dto/meeting-summary-fields.dto';

@ApiTags('meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly assetRevaluationService: AssetRevaluationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all meetings' })
  @ApiResponse({
    status: 200,
    description: 'A list of all meetings, ordered by date descending.',
    type: [Meeting],
  })
  findAll() {
    return this.meetingsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the active meeting' })
  @ApiResponse({
    status: 200,
    description: 'The active meeting, if any.',
    type: Meeting,
  })
  findActive() {
    return this.meetingsService.findActive();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({
    status: 201,
    description: 'The meeting has been successfully created.',
    type: Meeting,
  })
  create(@Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingsService.create(createMeetingDto);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close a meeting' })
  @ApiParam({ name: 'id', description: 'The ID of the meeting to close' })
  @ApiResponse({
    status: 200,
    description: 'The meeting has been successfully closed.',
    type: Meeting,
  })
  @ApiResponse({ status: 404, description: 'Meeting not found.' })
  @ApiResponse({ status: 400, description: 'Meeting is already closed.' })
  close(@Param('id') id: string) {
    return this.meetingsService.close(id);
  }

  @Get(':id/monthly-payments')
  @ApiOperation({ summary: 'Get all monthly payments for a meeting' })
  @ApiParam({ name: 'id', description: 'The ID of the meeting' })
  @ApiResponse({
    status: 200,
    description:
      'A list of all monthly payment operations for the meeting, including member details.',
    type: [Operation],
  })
  findMonthlyPaymentsByMeeting(@Param('id') id: string) {
    return this.meetingsService.findMonthlyPaymentsByMeeting(id);
  }

  @Post('active/record-monthly-payment')
  @ApiOperation({
    summary: 'Record monthly payments from a member in the active meeting',
  })
  @ApiBody({ type: SimplifiedRecordTransactionsDto })
  @ApiResponse({
    status: 201,
    description: 'The payments have been successfully recorded.',
  })
  recordMonthlyPayment(
    @Body() recordTransactionsDto: SimplifiedRecordTransactionsDto,
  ) {
    return this.meetingsService.recordMonthlyPayment(recordTransactionsDto);
  }

  @Post(':meetingId/buy/stocks')
  @ApiOperation({
    summary: 'Compra de acciones para un socio existente en la reunión',
  })
  buyStocksForMember(
    @Param('meetingId') meetingId: string,
    @Body() dto: BuyStockForMemberDto,
  ) {
    return this.meetingsService.buyStocksForMember(meetingId, dto);
  }

  @Post(':meetingId/withdraw/stocks')
  @ApiOperation({
    summary: 'Solicitar retiro de acciones para un socio en la reunión',
  })
  @ApiBody({ type: WithdrawStockForMemberDto })
  withdrawStocksForMember(
    @Param('meetingId') meetingId: string,
    @Body() dto: WithdrawStockForMemberDto,
  ) {
    return this.meetingsService.withdrawStocksForMember(meetingId, dto);
  }

  @Get(':id/disbursement-plan/preview')
  @ApiOperation({
    summary: 'Previsualizar el plan de desembolso para una reunión',
  })
  @ApiResponse({ status: 200, type: DisbursementPlanPreviewResponseDto })
  previewDisbursementPlan(@Param('id') meetingId: string) {
    return this.meetingsService.previewDisbursementPlan(meetingId);
  }

  @Post(':id/disbursement-plan/execute')
  @ApiOperation({
    summary: 'Ejecutar el plan de desembolso para una reunión (atómico)',
  })
  @ApiBody({ type: ExecuteDisbursementPlanDto })
  @ApiResponse({ status: 201, description: 'Plan ejecutado correctamente.' })
  executeDisbursementPlan(
    @Param('id') meetingId: string,
    @Body() dto: ExecuteDisbursementPlanDto,
  ) {
    console.log('executeDisbursementPlan', dto);
    return this.meetingsService.executeDisbursementPlan(meetingId, dto);
  }

  @Get(':id/summary')
  @ApiOperation({
    summary: 'Resumen flexible de la reunión (totales solicitados)',
  })
  @ApiParam({ name: 'id', description: 'ID de la reunión' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de la reunión (solo los campos solicitados)',
  })
  async getMeetingSummary(
    @Param('id') id: string,
    @Query() query: MeetingSummaryFieldsDto,
  ) {
    // Si no se especifican campos, devolver todos
    const fields =
      query.fields && query.fields.length > 0
        ? query.fields
        : [...MEETING_SUMMARY_FIELDS];
    return this.meetingsService.getMeetingSummary(id, fields);
  }
}
