import { Meeting } from '@domain/entities/meeting.entity';
import { Meeting as MeetingEntity } from '../entities/meeting.entity';

export class MeetingMapper {
  static toDomain(persistence: MeetingEntity): Meeting {
    try {
      return Meeting.fromPersistence({
        id: persistence.id,
        date: persistence.date,
        status: persistence.status,
        notes: persistence.notes ?? null,
        created_at:
          (persistence as unknown as { created_at?: Date | string })
            .created_at || new Date(),
      });
    } catch (error) {
      throw new Error(
        `Failed to map Meeting to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: Meeting): Partial<MeetingEntity> {
    const result: Partial<MeetingEntity> = {
      id: domain.id,
      date: domain.date,
      status: domain.status,
      notes: domain.notes ?? undefined,
    };

    return result;
  }
}
