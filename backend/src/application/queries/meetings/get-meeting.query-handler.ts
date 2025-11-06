import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { MeetingSummary } from '@application/services/meeting-summary.service';

export interface MeetingResponseWithSummaryDto extends MeetingResponseDto {
  summary?: MeetingSummary;
}

export class GetMeetingQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingSummaryService: MeetingSummaryService,
  ) {}

  async execute(
    meetingId: string,
    includeSummary = false,
  ): Promise<MeetingResponseWithSummaryDto> {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new MeetingNotFoundException(meetingId);
    }

    const result: MeetingResponseWithSummaryDto = {
      id: meeting.id,
      date: meeting.date,
      status: meeting.status,
      notes: meeting.notes,
      createdAt: meeting.createdAt,
    };

    if (includeSummary) {
      result.summary =
        await this.meetingSummaryService.calculateSummary(meetingId);
    }

    return result;
  }
}
