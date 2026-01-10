import { Injectable } from '@nestjs/common';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { DetailedMeetingSummaryDto } from '@application/dto/meetings/detailed-meeting-summary.dto';

@Injectable()
export class GetDetailedMeetingSummaryQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingSummaryService: MeetingSummaryService,
  ) {}

  async execute(meetingId: string): Promise<DetailedMeetingSummaryDto> {
    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting) {
      throw new MeetingNotFoundException(meetingId);
    }

    const detailedSummary =
      await this.meetingSummaryService.calculateDetailedSummary(meetingId);

    return {
      meeting: {
        id: meeting.id,
        date: meeting.date,
        status: meeting.status as 'active' | 'closed',
        notes: meeting.notes,
      },
      ...detailedSummary,
    };
  }
}
