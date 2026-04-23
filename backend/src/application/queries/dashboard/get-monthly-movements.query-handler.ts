import { Injectable } from '@nestjs/common';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { GetMonthlyMovementsResponseDto } from '@application/dto/dashboard/monthly-movements-response.dto';

@Injectable()
export class GetMonthlyMovementsQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingSummaryService: MeetingSummaryService,
  ) {}

  async execute(): Promise<GetMonthlyMovementsResponseDto> {
    const meetings = await this.meetingRepository.findAll();

    // Get last 6 closed meetings, sorted by date ASC for the chart
    const closedMeetings = meetings
      .filter(m => m.status === 'closed')
      .slice(0, 6)
      .reverse();

    const movements = await Promise.all(
      closedMeetings.map(async (meeting) => {
        const summary = await this.meetingSummaryService.calculateSummary(meeting.id);

        const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(meeting.date);

        return {
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace('.', ''),
          collected: summary.totalCollected || 0,
          disbursed: summary.totalDisbursed || 0,
        };
      })
    );

    return { movements };
  }
}
