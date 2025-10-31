import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { Meeting as MeetingDomain } from '@domain/entities/meeting.entity';
import { Meeting as MeetingEntity } from '../entities/meeting.entity';
import { MeetingMapper } from '../mappers/meeting.mapper';

@Injectable()
export class TypeOrmMeetingRepository implements MeetingRepository {
  constructor(
    @InjectRepository(MeetingEntity)
    private readonly repo: Repository<MeetingEntity>,
  ) {}

  async findById(id: string): Promise<MeetingDomain | null> {
    const entity = await this.repo.findOne({
      where: { id },
    });
    return entity ? MeetingMapper.toDomain(entity) : null;
  }

  async findActive(): Promise<MeetingDomain | null> {
    const entity = await this.repo.findOne({
      where: { status: 'active' },
    });
    return entity ? MeetingMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<MeetingDomain[]> {
    const entities = await this.repo.find({
      order: { date: 'DESC' },
    });
    return entities.map((e) => MeetingMapper.toDomain(e));
  }

  async save(meeting: MeetingDomain): Promise<MeetingDomain> {
    const persistence = MeetingMapper.toPersistence(meeting);

    // Check if meeting exists in DB
    const existing = await this.repo.findOne({
      where: { id: meeting.id },
    });

    if (existing) {
      // Update existing meeting
      await this.repo.update(meeting.id, persistence);
      const updated = await this.repo.findOne({
        where: { id: meeting.id },
      });
      if (!updated) {
        throw new Error('Meeting not found after update');
      }
      return MeetingMapper.toDomain(updated);
    } else {
      // Insert new meeting
      const saved = await this.repo.save(persistence as MeetingEntity);
      return MeetingMapper.toDomain(saved);
    }
  }

  async findLatestClosed(): Promise<MeetingDomain | null> {
    const entity = await this.repo.findOne({
      where: { status: 'closed' },
      order: { date: 'DESC' },
    });
    return entity ? MeetingMapper.toDomain(entity) : null;
  }
}
