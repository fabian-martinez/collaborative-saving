import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { Meeting as MeetingDomain } from '@domain/entities/meeting.entity';
import { Meeting as MeetingEntity } from '../entities/meeting.entity';
import { MeetingMapper } from '../mappers/meeting.mapper';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';

@Injectable()
export class TypeOrmMeetingRepository implements MeetingRepository {
  constructor(
    @InjectRepository(MeetingEntity)
    private readonly repo: Repository<MeetingEntity>,
    private readonly transactionManager: TransactionManager,
  ) {}

  private getRepository(): Repository<MeetingEntity> {
    const activeQueryRunner = this.transactionManager.getActiveQueryRunner();
    if (activeQueryRunner) {
      return activeQueryRunner.manager.getRepository(
        MeetingEntity,
      ) as Repository<MeetingEntity>;
    }
    return this.repo;
  }

  async findById(id: string): Promise<MeetingDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({
      where: { id },
    });
    return entity ? MeetingMapper.toDomain(entity) : null;
  }

  async findActive(): Promise<MeetingDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({
      where: { status: 'active' },
    });
    return entity ? MeetingMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<MeetingDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      order: { date: 'DESC' },
    });
    return entities.map((e) => MeetingMapper.toDomain(e));
  }

  async save(meeting: MeetingDomain): Promise<MeetingDomain> {
    const repo = this.getRepository();
    const persistence = MeetingMapper.toPersistence(meeting);

    // Check if meeting exists in DB
    const existing = await repo.findOne({
      where: { id: meeting.id },
    });

    if (existing) {
      // Update existing meeting
      await repo.update(meeting.id, persistence);
      const updated = await repo.findOne({
        where: { id: meeting.id },
      });
      if (!updated) {
        throw new Error('Meeting not found after update');
      }
      return MeetingMapper.toDomain(updated);
    } else {
      // Insert new meeting
      const saved = await repo.save(persistence as MeetingEntity);
      return MeetingMapper.toDomain(saved);
    }
  }

  async findLatestClosed(): Promise<MeetingDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({
      where: { status: 'closed' },
      order: { date: 'DESC' },
    });
    return entity ? MeetingMapper.toDomain(entity) : null;
  }
}
