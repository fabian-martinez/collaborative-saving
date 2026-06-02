import { GetMeetingQueryHandler } from './get-meeting.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';

describe('GetMeetingQueryHandler', () => {
  let queryHandler: GetMeetingQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let meetingSummaryService: jest.Mocked<MeetingSummaryService>;
  let findByIdSpy: jest.SpyInstance;
  let calculateSummarySpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    };

    meetingSummaryService = {
      calculateSummary: jest.fn(),
    } as unknown as jest.Mocked<MeetingSummaryService>;

    findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    calculateSummarySpy = jest.spyOn(meetingSummaryService, 'calculateSummary');

    queryHandler = new GetMeetingQueryHandler(
      meetingRepository,
      meetingSummaryService,
    );
  });

  it('should throw MeetingNotFoundException when meeting does not exist', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    findByIdSpy.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(queryHandler.execute(meetingId)).rejects.toThrow(
      MeetingNotFoundException,
    );
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should return meeting when found', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    findByIdSpy.mockResolvedValue(meeting);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: meeting.id,
      date: meeting.date,
      status: meeting.status,
      notes: meeting.notes,
      createdAt: meeting.createdAt,
    });
  });

  it('should map all meeting fields correctly', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15T10:30:00Z'),
      notes: 'Complete meeting notes',
    });

    findByIdSpy.mockResolvedValue(meeting);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result).toMatchObject({
      id: meeting.id,
      status: MeetingStatus.ACTIVE,
      notes: 'Complete meeting notes',
    });
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should handle meetings with null notes', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: null,
    });

    findByIdSpy.mockResolvedValue(meeting);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result.notes).toBeNull();
    expect(result).toEqual({
      id: meeting.id,
      date: meeting.date,
      status: meeting.status,
      notes: null,
      createdAt: meeting.createdAt,
    });
  });

  it('should handle closed meetings', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Active meeting',
    });
    const closedMeeting = Meeting.fromPersistence({
      id: activeMeeting.id,
      date: new Date('2024-01-15'),
      status: MeetingStatus.CLOSED,
      notes: 'Closed meeting',
    });

    findByIdSpy.mockResolvedValue(closedMeeting);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result.status).toBe(MeetingStatus.CLOSED);
    expect(result.notes).toBe('Closed meeting');
    expect(calculateSummarySpy).not.toHaveBeenCalled();
  });

  it('should include summary when includeSummary is true', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const mockSummary = {
      totalCash: 150000.0,
      totalInterest: 5000.0,
      totalLoans: 20000.0,
      totalCollected: 145000.0,
      totalDividends: 10000.0,
      totalStockInvestment: 30000.0,
      finalCashBalance: 120000.0,
      totalDisbursed: 30000.0,
      participantsCount: 15,
      duration: '2h 30m',
    };

    findByIdSpy.mockResolvedValue(meeting);
    calculateSummarySpy.mockResolvedValue(mockSummary);

    // ACT
    const result = await queryHandler.execute(meetingId, true);

    // ASSERT
    expect(calculateSummarySpy).toHaveBeenCalledWith(meetingId);
    expect(result.summary).toEqual(mockSummary);
    expect(result.id).toBe(meeting.id);
  });

  it('should not include summary when includeSummary is false', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    findByIdSpy.mockResolvedValue(meeting);

    // ACT
    const result = await queryHandler.execute(meetingId, false);

    // ASSERT
    expect(calculateSummarySpy).not.toHaveBeenCalled();
    expect(result.summary).toBeUndefined();
  });

  it('should not include summary by default', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    findByIdSpy.mockResolvedValue(meeting);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(calculateSummarySpy).not.toHaveBeenCalled();
    expect(result.summary).toBeUndefined();
  });
});
