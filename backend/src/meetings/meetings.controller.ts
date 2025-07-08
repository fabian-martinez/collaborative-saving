import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
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
import { RevaluateAssetsResponseDto } from './dto/revaluate-assets-response.dto';
import { Operation } from '../operations/entities/operation.entity';
import { AssetRevaluationService } from '../asset-revaluation/asset-revaluation.service';

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

  @Post(':id/revaluate-assets')
  @ApiOperation({ summary: 'Trigger asset revaluation for a meeting' })
  @ApiParam({ name: 'id', description: 'The ID of the meeting' })
  @ApiResponse({
    status: 200,
    description: 'Asset revaluation process has been started.',
    type: RevaluateAssetsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Meeting not found.' })
  revaluateAssets(@Param('id') id: string) {
    return this.assetRevaluationService.revaluateAssets(id);
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
}
