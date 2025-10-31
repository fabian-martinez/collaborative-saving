import { Meeting, MeetingStatus } from './meeting.entity';

describe('Meeting Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create Meeting with minimal required fields', () => {
      const meeting = Meeting.create({});

      expect(meeting.id).toBeDefined();
      expect(meeting.date).toBeInstanceOf(Date);
      expect(meeting.status).toBe(MeetingStatus.ACTIVE);
      expect(meeting.notes).toBeNull();
      expect(meeting.createdAt).toBeInstanceOf(Date);
      expect(meeting.isActive()).toBe(true);
      expect(meeting.isClosed()).toBe(false);
    });

    it('should create Meeting with all fields', () => {
      const meeting = Meeting.create({
        date: mockDate,
        notes: 'Test meeting notes',
      });

      expect(meeting.date).toEqual(mockDate);
      expect(meeting.status).toBe(MeetingStatus.ACTIVE);
      expect(meeting.notes).toBe('Test meeting notes');
    });

    it('should use current date if date not provided', () => {
      const before = new Date();
      const meeting = Meeting.create({});
      const after = new Date();

      expect(meeting.date.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(meeting.date.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error if date is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(() => {
        new Meeting(mockId, futureDate, MeetingStatus.ACTIVE, null, new Date());
      }).toThrow('Meeting date cannot be in the future');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create Meeting from persistence data', () => {
      const meeting = Meeting.fromPersistence({
        id: mockId,
        date: mockDate,
        status: 'active',
        notes: 'Test notes',
        created_at: mockDate,
      });

      expect(meeting.id).toBe(mockId);
      expect(meeting.date).toEqual(mockDate);
      expect(meeting.status).toBe(MeetingStatus.ACTIVE);
      expect(meeting.notes).toBe('Test notes');
      expect(meeting.createdAt).toEqual(mockDate);
    });

    it('should handle string dates', () => {
      const meeting = Meeting.fromPersistence({
        id: mockId,
        date: '2024-01-15T00:00:00.000Z',
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
      });

      expect(meeting.date).toBeInstanceOf(Date);
      expect(meeting.createdAt).toBeInstanceOf(Date);
    });

    it('should map closed status correctly', () => {
      const meeting = Meeting.fromPersistence({
        id: mockId,
        date: mockDate,
        status: 'closed',
        created_at: mockDate,
      });

      expect(meeting.status).toBe(MeetingStatus.CLOSED);
      expect(meeting.isClosed()).toBe(true);
      expect(meeting.isActive()).toBe(false);
    });

    it('should handle null notes', () => {
      const meeting = Meeting.fromPersistence({
        id: mockId,
        date: mockDate,
        status: 'active',
        notes: null,
        created_at: mockDate,
      });

      expect(meeting.notes).toBeNull();
    });
  });

  describe('updateNotes method', () => {
    it('should update notes', () => {
      const meeting = Meeting.create({});
      expect(meeting.notes).toBeNull();

      meeting.updateNotes('Updated notes');
      expect(meeting.notes).toBe('Updated notes');
    });

    it('should set notes to null', () => {
      const meeting = Meeting.create({ notes: 'Initial notes' });
      meeting.updateNotes(null);
      expect(meeting.notes).toBeNull();
    });
  });

  describe('close method', () => {
    it('should close an active meeting', () => {
      const meeting = Meeting.create({});
      expect(meeting.isActive()).toBe(true);

      meeting.close();
      expect(meeting.isClosed()).toBe(true);
      expect(meeting.isActive()).toBe(false);
    });

    it('should throw error if already closed', () => {
      const meeting = Meeting.create({});
      meeting.close();

      expect(() => {
        meeting.close();
      }).toThrow('Meeting is already closed');
    });
  });

  describe('getters', () => {
    it('should return correct property values', () => {
      const meeting = Meeting.create({
        date: mockDate,
        notes: 'Test notes',
      });

      expect(meeting.date).toEqual(mockDate);
      expect(meeting.status).toBe(MeetingStatus.ACTIVE);
      expect(meeting.notes).toBe('Test notes');
    });
  });
});
