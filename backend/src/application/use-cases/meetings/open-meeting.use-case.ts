import { OpenMeetingDto } from '@application/dto/meetings/open-meeting.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { BadRequestException } from '@nestjs/common';
import { Meeting } from '@domain/entities/meeting.entity';

export class OpenMeetingUseCase {
  constructor(private readonly meetingRepository: MeetingRepository) {}

  async execute(dto: OpenMeetingDto): Promise<MeetingResponseDto> {
    // Validar que no exista una reunión activa
    const activeMeeting = await this.meetingRepository.findActive();
    if (activeMeeting) {
      throw new BadRequestException(
        'An active meeting already exists. Please close it before creating a new one.',
      );
    }

    const meeting = Meeting.create({
      date: dto.date,
      notes: dto.notes,
    });

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
