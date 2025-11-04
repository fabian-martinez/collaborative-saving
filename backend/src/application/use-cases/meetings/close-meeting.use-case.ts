import { CloseMeetingDto } from '@application/dto/meetings/close-meeting.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class CloseMeetingUseCase {
  constructor(private readonly meetingRepository: MeetingRepository) {}

  async execute(dto: CloseMeetingDto): Promise<MeetingResponseDto> {
    const meeting = await this.meetingRepository.findById(dto.meetingId);

    if (!meeting) {
      throw new MeetingNotFoundException(dto.meetingId);
    }

    if (meeting.isClosed()) {
      throw new InvalidRequestError('This meeting is already closed');
    }

    meeting.close();
    const saved = await this.meetingRepository.save(meeting);

    return {
      id: saved.id,
      date: saved.date,
      status: saved.status,
      notes: saved.notes,
      createdAt: saved.createdAt,
    };
  }
}
