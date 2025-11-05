import { GetMeetingsQueryHandler } from './get-meetings.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';

describe('GetMeetingsQueryHandler', () => {
  let queryHandler: GetMeetingsQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let findAllSpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    findAllSpy = jest.spyOn(meetingRepository, 'findAll');

    queryHandler = new GetMeetingsQueryHandler(meetingRepository);
  });

  it('should return empty array when no meetings exist', async () => {
    // ARRANGE
    findAllSpy.mockResolvedValue([]);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(findAllSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('should return list of meetings', async () => {
    // ARRANGE
    const meeting1 = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting 1',
    });
    const meeting2 = Meeting.create({
      date: new Date('2024-02-15'),
      notes: 'Test meeting 2',
    });

    findAllSpy.mockResolvedValue([meeting1, meeting2]);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(findAllSpy).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: meeting1.id,
      date: meeting1.date,
      status: meeting1.status,
      notes: meeting1.notes,
      createdAt: meeting1.createdAt,
    });
    expect(result[1]).toEqual({
      id: meeting2.id,
      date: meeting2.date,
      status: meeting2.status,
      notes: meeting2.notes,
      createdAt: meeting2.createdAt,
    });
  });

  it('should map all meeting fields correctly', async () => {
    // ARRANGE
    const meeting = Meeting.create({
      date: new Date('2024-01-15T10:30:00Z'),
      notes: 'Complete meeting notes',
    });

    findAllSpy.mockResolvedValue([meeting]);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result[0]).toMatchObject({
      id: meeting.id,
      status: MeetingStatus.ACTIVE,
      notes: 'Complete meeting notes',
    });
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it('should handle meetings with null notes', async () => {
    // ARRANGE
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: null,
    });

    findAllSpy.mockResolvedValue([meeting]);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result[0].notes).toBeNull();
    expect(result[0]).toEqual({
      id: meeting.id,
      date: meeting.date,
      status: meeting.status,
      notes: null,
      createdAt: meeting.createdAt,
    });
  });

  it('should handle meetings with different statuses', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Active meeting',
    });
    const closedMeeting = Meeting.fromPersistence({
      id: activeMeeting.id,
      date: new Date('2024-02-15'),
      status: MeetingStatus.CLOSED,
      notes: 'Closed meeting',
    });

    findAllSpy.mockResolvedValue([activeMeeting, closedMeeting]);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe(MeetingStatus.ACTIVE);
    expect(result[1].status).toBe(MeetingStatus.CLOSED);
  });

  it('should return meetings ordered by date descending (as returned by repository)', async () => {
    // ARRANGE
    const meeting1 = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'January meeting',
    });
    const meeting2 = Meeting.create({
      date: new Date('2024-02-15'),
      notes: 'February meeting',
    });
    const meeting3 = Meeting.create({
      date: new Date('2024-03-15'),
      notes: 'March meeting',
    });

    // Repository returns in descending order (newest first)
    findAllSpy.mockResolvedValue([meeting3, meeting2, meeting1]);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result).toHaveLength(3);
    expect(result[0].notes).toBe('March meeting');
    expect(result[1].notes).toBe('February meeting');
    expect(result[2].notes).toBe('January meeting');
  });
});
