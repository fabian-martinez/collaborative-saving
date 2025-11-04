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
import { OpenMeetingHttpDto } from '../dto/open-meeting-http.dto';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { OpenMeetingResponseHttpDto } from '../dto/open-meeting-response-http.dto';

@ApiTags('Meetings V2')
@Controller('v2/meetings')
export class MeetingsV2Controller {
  constructor(
    private readonly openMeetingUseCase: OpenMeetingUseCase,
    private readonly closeMeetingUseCase: CloseMeetingUseCase,
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
    description: 'Bad request - Meeting is already closed',
  })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OpenMeetingResponseHttpDto> {
    try {
      const result = await this.closeMeetingUseCase.execute({ meetingId: id });
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
  private mapMeetingToHttp(m: MeetingResponseDto): OpenMeetingResponseHttpDto {
    return {
      id: m.id,
      date: m.date,
      status: m.status,
      notes: m.notes,
      created_at: m.createdAt,
    };
  }
}
