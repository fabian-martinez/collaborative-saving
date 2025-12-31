import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { MeetingSummary } from '@application/services/meeting-summary.service';

export interface ActiveMeetingResponseWithSummaryDto extends MeetingResponseDto {
  summary: MeetingSummary;
}

export class GetActiveMeetingQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingSummaryService: MeetingSummaryService,
  ) {}

  async execute(): Promise<ActiveMeetingResponseWithSummaryDto> {
    const meeting = await this.meetingRepository.findActive();
    if (!meeting) {
      throw new MeetingNotFoundException('active');
    }

    const summary = await this.meetingSummaryService.calculateSummary(
      meeting.id,
    );

    return {
      id: meeting.id,
      date: meeting.date,
      status: meeting.status,
      notes: meeting.notes,
      createdAt: meeting.createdAt,
      summary,
    };
  }
}
