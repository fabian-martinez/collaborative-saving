import { OperationMapper } from './operation.mapper';
import { Operation } from '@domain/entities/operation.entity';
import { Operation as OperationEntity } from '../entities/operation.entity';

describe('OperationMapper', () => {
  describe('toDomain', () => {
    it('should map OperationEntity to Domain Operation', () => {
      const entity: Partial<OperationEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: 'MONTHLY_PAYMENT',
        date: new Date('2024-01-15'),
        description: 'Monthly payment',
      };

      const domain = OperationMapper.toDomain(entity as OperationEntity);

      expect(domain).toBeInstanceOf(Operation);
      expect(domain.id).toBe(entity.id);
      expect(domain.memberId).toBe('member-1');
      expect(domain.type).toBe('MONTHLY_PAYMENT');
    });

    it('should handle null memberId', () => {
      const entity: Partial<OperationEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: null,
        meetingId: 'meeting-1',
        type: 'MONTHLY_PAYMENT',
        date: new Date('2024-01-15'),
        description: null,
      };

      const domain = OperationMapper.toDomain(entity as OperationEntity);
      expect(domain.memberId).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should map Domain Operation to OperationEntity', () => {
      const domain = Operation.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: 'MONTHLY_PAYMENT',
      });

      const persistence = OperationMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.meetingId).toBe(domain.meetingId);
      expect(persistence.type).toBe(domain.type);
    });
  });
});
