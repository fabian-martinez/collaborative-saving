import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMandatoryContributionDto } from './dto/create-mandatory-contribution.dto';
import { UpdateMandatoryContributionDto } from './dto/update-mandatory-contribution.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { SimplifiedRecordTransactionsDto } from './dto/simplified-record-transactions.dto';
import { Meeting } from './entities/meeting.entity';
import { MandatoryContribution } from './entities/mandatory-contribution.entity';
import { RevaluateAssetsResponseDto } from './dto/revaluate-assets-response.dto';
import { MemberDue } from './meetings.service';

@ApiTags('meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

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
    return this.meetingsService.revaluateAssets(id);
  }

  @Get('active/member-dues/:memberId')
  @ApiOperation({ summary: 'Get all dues for a member for the active meeting' })
  @ApiResponse({
    status: 200,
    description:
      'Returns a flat list of the member dues. Each due object contains type, description, amount, and optional referenceId and details.',
    type: [Object],
  })
  getMemberDuesForActiveMeeting(
    @Param('memberId') memberId: string,
  ): Promise<MemberDue[]> {
    return this.meetingsService.getMemberDuesForActiveMeeting(memberId);
  }

  @Post('active/record-payments')
  @ApiOperation({
    summary: 'Record multiple payments from a member in the active meeting',
  })
  @ApiBody({ type: SimplifiedRecordTransactionsDto })
  @ApiResponse({
    status: 201,
    description: 'The payments have been successfully recorded.',
  })
  recordMemberPayments(
    @Body() recordTransactionsDto: SimplifiedRecordTransactionsDto,
  ) {
    return this.meetingsService.recordMemberPayments(recordTransactionsDto);
  }

  // CRUD for Mandatory Contributions
  @Post('mandatory-contributions')
  @ApiOperation({ summary: 'Create a new mandatory contribution type' })
  @ApiResponse({
    status: 201,
    description: 'The mandatory contribution has been successfully created.',
    type: MandatoryContribution,
  })
  createMandatoryContribution(
    @Body() createDto: CreateMandatoryContributionDto,
  ) {
    return this.meetingsService.createMandatoryContribution(createDto);
  }

  @Get('mandatory-contributions')
  @ApiOperation({ summary: 'Get all mandatory contribution types' })
  @ApiResponse({
    status: 200,
    description: 'A list of all mandatory contributions.',
    type: [MandatoryContribution],
  })
  findAllMandatoryContributions() {
    return this.meetingsService.findAllMandatoryContributions();
  }

  @Get('mandatory-contributions/:id')
  @ApiOperation({ summary: 'Get a mandatory contribution type by id' })
  @ApiParam({ name: 'id', description: 'The ID of the mandatory contribution' })
  @ApiResponse({
    status: 200,
    description: 'The mandatory contribution.',
    type: MandatoryContribution,
  })
  @ApiResponse({
    status: 404,
    description: 'Mandatory contribution not found.',
  })
  findOneMandatoryContribution(@Param('id') id: string) {
    return this.meetingsService.findOneMandatoryContribution(id);
  }

  @Patch('mandatory-contributions/:id')
  @ApiOperation({ summary: 'Update a mandatory contribution type' })
  @ApiParam({ name: 'id', description: 'The ID of the mandatory contribution' })
  @ApiResponse({
    status: 200,
    description: 'The mandatory contribution has been successfully updated.',
    type: MandatoryContribution,
  })
  @ApiResponse({
    status: 404,
    description: 'Mandatory contribution not found.',
  })
  updateMandatoryContribution(
    @Param('id') id: string,
    @Body() updateDto: UpdateMandatoryContributionDto,
  ) {
    return this.meetingsService.updateMandatoryContribution(id, updateDto);
  }

  @Delete('mandatory-contributions/:id')
  @ApiOperation({ summary: 'Delete a mandatory contribution type' })
  @ApiParam({ name: 'id', description: 'The ID of the mandatory contribution' })
  @ApiResponse({
    status: 200,
    description: 'The mandatory contribution has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Mandatory contribution not found.',
  })
  removeMandatoryContribution(@Param('id') id: string) {
    return this.meetingsService.removeMandatoryContribution(id);
  }
}
