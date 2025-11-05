import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';

export class GetMeetingsQueryHandler {
  constructor(private readonly meetingRepository: MeetingRepository) {}

  async execute(): Promise<MeetingResponseDto[]> {
    const meetings = await this.meetingRepository.findAll();
    return meetings.map((m) => ({
      id: m.id,
      date: m.date,
      status: m.status,
      notes: m.notes,
      createdAt: m.createdAt,
    }));
  }
}
