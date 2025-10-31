import { MeetingMapper } from './meeting.mapper';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { Meeting as MeetingEntity } from '../entities/meeting.entity';

describe('MeetingMapper', () => {
  describe('toDomain', () => {
    it('should map MeetingEntity to Domain Meeting', () => {
      const entity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: 'active',
        notes: 'Test meeting',
        operations: [],
      } as unknown as MeetingEntity;

      const domain = MeetingMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Meeting);
      expect(domain.id).toBe(entity.id);
      expect(domain.date).toEqual(entity.date);
      expect(domain.status).toBe(MeetingStatus.ACTIVE);
      expect(domain.notes).toBe('Test meeting');
    });

    it('should handle closed status', () => {
      const entity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: 'closed',
        notes: null,
        operations: [],
      } as unknown as MeetingEntity;

      const domain = MeetingMapper.toDomain(entity);

      expect(domain.status).toBe(MeetingStatus.CLOSED);
      expect(domain.isClosed()).toBe(true);
    });

    it('should handle null notes', () => {
      const entity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: 'active',
        notes: null,
        operations: [],
      } as unknown as MeetingEntity;

      const domain = MeetingMapper.toDomain(entity);

      expect(domain.notes).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should map Domain Meeting to MeetingEntity', () => {
      const domain = Meeting.create({
        date: new Date('2024-01-15'),
        notes: 'Test meeting',
      });

      const persistence = MeetingMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.date).toEqual(domain.date);
      expect(persistence.status).toBe(domain.status);
      expect(persistence.notes).toBe(domain.notes);
    });

    it('should map closed meeting correctly', () => {
      const domain = Meeting.create({});
      domain.close();

      const persistence = MeetingMapper.toPersistence(domain);

      expect(persistence.status).toBe(MeetingStatus.CLOSED);
    });
  });
});
