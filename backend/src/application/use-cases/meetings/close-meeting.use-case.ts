import { CloseMeetingDto } from '@application/dto/meetings/close-meeting.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

export class CloseMeetingUseCase {
  constructor(private readonly meetingRepository: MeetingRepository) {}

  async execute(dto: CloseMeetingDto): Promise<MeetingResponseDto> {
    const meeting = await this.meetingRepository.findById(dto.meetingId);

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${dto.meetingId} not found`);
    }

    if (meeting.isClosed()) {
      throw new BadRequestException('This meeting is already closed');
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
