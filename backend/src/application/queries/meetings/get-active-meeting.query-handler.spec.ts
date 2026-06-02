import { GetActiveMeetingQueryHandler } from './get-active-meeting.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';

describe('GetActiveMeetingQueryHandler', () => {
  let queryHandler: GetActiveMeetingQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let meetingSummaryService: jest.Mocked<MeetingSummaryService>;
  let findActiveSpy: jest.SpyInstance;
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

    findActiveSpy = jest.spyOn(meetingRepository, 'findActive');
    calculateSummarySpy = jest.spyOn(meetingSummaryService, 'calculateSummary');

    queryHandler = new GetActiveMeetingQueryHandler(
      meetingRepository,
      meetingSummaryService,
    );
  });

  it('should throw MeetingNotFoundException when no active meeting exists', async () => {
    // ARRANGE
    findActiveSpy.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(queryHandler.execute()).rejects.toThrow(
      MeetingNotFoundException,
    );
    expect(findActiveSpy).toHaveBeenCalledTimes(1);
  });

  it('should return active meeting with summary when found', async () => {
    // ARRANGE
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test active meeting',
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

    findActiveSpy.mockResolvedValue(meeting);
    calculateSummarySpy.mockResolvedValue(mockSummary);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(findActiveSpy).toHaveBeenCalledTimes(1);
    expect(calculateSummarySpy).toHaveBeenCalledWith(meeting.id);
    expect(result).toEqual({
      id: meeting.id,
      date: meeting.date,
      status: meeting.status,
      notes: meeting.notes,
      createdAt: meeting.createdAt,
      summary: mockSummary,
    });
    expect(result.status).toBe(MeetingStatus.ACTIVE);
    expect(result.summary).toBeDefined();
  });

  it('should map all meeting fields correctly with summary', async () => {
    // ARRANGE
    const meeting = Meeting.create({
      date: new Date('2024-01-15T10:30:00Z'),
      notes: 'Complete active meeting notes',
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

    findActiveSpy.mockResolvedValue(meeting);
    calculateSummarySpy.mockResolvedValue(mockSummary);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result).toMatchObject({
      id: meeting.id,
      status: MeetingStatus.ACTIVE,
      notes: 'Complete active meeting notes',
      summary: mockSummary,
    });
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.summary).toBeDefined();
  });

  it('should handle active meetings with null notes and include summary', async () => {
    // ARRANGE
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: null,
    });

    const mockSummary = {
      totalCash: 0,
      totalInterest: 0,
      totalLoans: 0,
      totalCollected: 0,
      totalDividends: 0,
      totalStockInvestment: 0,
      finalCashBalance: 0,
      totalDisbursed: 0,
      participantsCount: 0,
      duration: '0h 0m',
    };

    findActiveSpy.mockResolvedValue(meeting);
    calculateSummarySpy.mockResolvedValue(mockSummary);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result.notes).toBeNull();
    expect(result.status).toBe(MeetingStatus.ACTIVE);
    expect(result.summary).toBeDefined();
    expect(result).toEqual({
      id: meeting.id,
      date: meeting.date,
      status: meeting.status,
      notes: null,
      createdAt: meeting.createdAt,
      summary: mockSummary,
    });
  });

  it('should always include summary for active meetings', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Active meeting',
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

    findActiveSpy.mockResolvedValue(activeMeeting);
    calculateSummarySpy.mockResolvedValue(mockSummary);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result.status).toBe(MeetingStatus.ACTIVE);
    expect(findActiveSpy).toHaveBeenCalledTimes(1);
    expect(calculateSummarySpy).toHaveBeenCalledWith(activeMeeting.id);
    expect(result.summary).toBeDefined();
    expect(result.summary).toEqual(mockSummary);
  });
});
