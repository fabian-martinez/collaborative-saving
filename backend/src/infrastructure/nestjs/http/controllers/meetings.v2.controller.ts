import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
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
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/meetings/record-monthly-payments.use-case';
import { OpenMeetingHttpDto } from '../dto/open-meeting-http.dto';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { RecordMonthlyPaymentsDto } from '@application/dto/meetings/record-monthly-payments.dto';
import { RecordMonthlyPaymentsResponseDto } from '@application/dto/meetings/record-monthly-payments-response.dto';

@ApiTags('Meetings V2')
@Controller('api/v2/meetings')
export class MeetingsV2Controller {
  constructor(
    private readonly openMeetingUseCase: OpenMeetingUseCase,
    private readonly closeMeetingUseCase: CloseMeetingUseCase,
    private readonly recordMonthlyPaymentsUseCase: RecordMonthlyPaymentsUseCase,
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
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - An active meeting already exists or invalid data',
  })
  async open(@Body() dto: OpenMeetingHttpDto): Promise<MeetingResponseDto> {
    try {
      const openDto = {
        date: dto.date,
        notes: dto.notes,
      };
      return await this.openMeetingUseCase.execute(openDto);
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
      'Closes an active meeting. Once closed, no new operations can be added.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Meeting closed successfully',
    type: MeetingResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Meeting is already closed',
  })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MeetingResponseDto> {
    try {
      return await this.closeMeetingUseCase.execute({ meetingId: id });
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

  @Post('record-monthly-payment')
  @ApiOperation({
    summary: 'Record monthly payments for a member',
    description:
      'Records all monthly payments (contributions, fees, loans) for a member in the active meeting',
  })
  @ApiBody({ type: RecordMonthlyPaymentsDto })
  @ApiResponse({
    status: 201,
    description: 'Payments recorded successfully',
    type: RecordMonthlyPaymentsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment data or no active meeting',
  })
  @ApiNotFoundResponse({ description: 'Member not found' })
  async recordPayment(
    @Body() dto: RecordMonthlyPaymentsDto,
  ): Promise<RecordMonthlyPaymentsResponseDto> {
    try {
      return await this.recordMonthlyPaymentsUseCase.execute(dto);
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
}
