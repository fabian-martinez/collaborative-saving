import { GetDetailedMeetingSummaryQueryHandler } from './get-detailed-meeting-summary.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { Meeting } from '@domain/entities/meeting.entity';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';

describe('GetDetailedMeetingSummaryQueryHandler', () => {
  let queryHandler: GetDetailedMeetingSummaryQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let meetingSummaryService: jest.Mocked<MeetingSummaryService>;
  let findByIdSpy: jest.SpyInstance;
  let calculateDetailedSummarySpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    meetingSummaryService = {
      calculateSummary: jest.fn(),
      calculateDetailedSummary: jest.fn(),
    } as unknown as jest.Mocked<MeetingSummaryService>;

    findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    calculateDetailedSummarySpy = jest.spyOn(
      meetingSummaryService,
      'calculateDetailedSummary',
    );

    queryHandler = new GetDetailedMeetingSummaryQueryHandler(
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
    expect(calculateDetailedSummarySpy).not.toHaveBeenCalled();
  });

  it('should return detailed summary when meeting exists', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const mockDetailedSummary = {
      summary: {
        totalCollected: 150000.0,
        totalDisbursed: 30000.0,
        shareValue: 1500.0,
        participants: 15,
      },
      collections: {
        memberContributions: { count: 10, amount: 100000.0 },
        loanPayments: { count: 5, amount: 30000.0 },
        interestCollected: 5000.0,
        feesCollected: 1000.0,
      },
      disbursements: {
        newLoans: { count: 2, amount: 20000.0 },
        stockLiquidations: { count: 1, amount: 5000.0 },
        dividendPayments: { count: 3, amount: 5000.0 },
      },
      metrics: {
        attendance: { current: 15, percentage: 100 },
        revaluation: null,
        paymentsUpToDate: 8,
        overduePayments: 2,
      },
    };

    findByIdSpy.mockResolvedValue(meeting);
    calculateDetailedSummarySpy.mockResolvedValue(mockDetailedSummary);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(calculateDetailedSummarySpy).toHaveBeenCalledWith(meetingId);
    expect(result.meeting.id).toBe(meeting.id);
    expect(result.meeting.date).toEqual(meeting.date);
    expect(result.meeting.status).toBe(meeting.status);
    expect(result.meeting.notes).toBe(meeting.notes);
    expect(result.summary).toEqual(mockDetailedSummary.summary);
    expect(result.collections).toEqual(mockDetailedSummary.collections);
    expect(result.disbursements).toEqual(mockDetailedSummary.disbursements);
    expect(result.metrics).toEqual(mockDetailedSummary.metrics);
  });

  it('should return detailed summary with revaluation when available', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const mockDetailedSummary = {
      summary: {
        totalCollected: 150000.0,
        totalDisbursed: 30000.0,
        shareValue: 1080.0,
        participants: 15,
      },
      collections: {
        memberContributions: { count: 10, amount: 100000.0 },
        loanPayments: { count: 5, amount: 30000.0 },
        interestCollected: 5000.0,
        feesCollected: 1000.0,
      },
      disbursements: {
        newLoans: { count: 2, amount: 20000.0 },
        stockLiquidations: { count: 1, amount: 5000.0 },
        dividendPayments: { count: 3, amount: 5000.0 },
      },
      metrics: {
        attendance: { current: 15, percentage: 100 },
        revaluation: {
          previousValue: 1000.0,
          newValue: 1080.0,
          percentage: 8.0,
        },
        paymentsUpToDate: 8,
        overduePayments: 2,
      },
    };

    findByIdSpy.mockResolvedValue(meeting);
    calculateDetailedSummarySpy.mockResolvedValue(mockDetailedSummary);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result.metrics.revaluation).not.toBeNull();
    expect(result.metrics.revaluation?.previousValue).toBe(1000.0);
    expect(result.metrics.revaluation?.newValue).toBe(1080.0);
    expect(result.metrics.revaluation?.percentage).toBe(8.0);
  });
});
