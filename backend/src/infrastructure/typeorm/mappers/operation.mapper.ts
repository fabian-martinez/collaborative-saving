import { Operation as OperationDomain } from '@domain/entities/operation.entity';
import { Operation as OperationEntity } from '../entities/operation.entity';

export class OperationMapper {
  static toDomain(persistence: OperationEntity): OperationDomain {
    try {
      return OperationDomain.fromPersistence({
        id: persistence.id,
        member_id: persistence.memberId ?? null,
        meeting_id: persistence.meetingId,
        type: persistence.type,
        date: persistence.date,
        description: persistence.description ?? null,
      });
    } catch (error) {
      throw new Error(
        `Failed to map Operation to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: OperationDomain): Partial<OperationEntity> {
    return {
      id: domain.id,
      memberId: domain.memberId ?? null,
      meetingId: domain.meetingId,
      type: domain.type,
      date: domain.date,
      description: domain.description ?? null,
    };
  }
}
