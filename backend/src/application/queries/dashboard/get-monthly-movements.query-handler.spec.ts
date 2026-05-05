import { GetMonthlyMovementsQueryHandler } from './get-monthly-movements.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { Meeting } from '@domain/entities/meeting.entity';

describe('GetMonthlyMovementsQueryHandler', () => {
  let handler: GetMonthlyMovementsQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let meetingSummaryService: jest.Mocked<MeetingSummaryService>;

  beforeEach(() => {
    meetingRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    meetingSummaryService = {
      calculateSummary: jest.fn(),
    } as unknown as jest.Mocked<MeetingSummaryService>;

    handler = new GetMonthlyMovementsQueryHandler(
      meetingRepository,
      meetingSummaryService,
    );
  });

  it('should return monthly movements for the last 6 closed meetings in chronological order', async () => {
    const mockMeetings: Partial<Meeting>[] = [
      { id: '1', date: new Date('2024-01-15'), status: 'closed' },
      { id: '2', date: new Date('2024-02-15'), status: 'closed' },
      { id: '3', date: new Date('2024-03-15'), status: 'closed' },
      { id: '4', date: new Date('2024-04-15'), status: 'closed' },
      { id: '5', date: new Date('2024-05-15'), status: 'closed' },
      { id: '6', date: new Date('2024-06-15'), status: 'closed' },
      { id: '7', date: new Date('2024-07-15'), status: 'active' },
    ];

    // Repository returns newest first
    meetingRepository.findAll.mockResolvedValue(
      [...mockMeetings].reverse() as Meeting[],
    );

    meetingSummaryService.calculateSummary.mockImplementation((id) => {
      const index = parseInt(id);
      return Promise.resolve({
        totalCollected: index * 1000,
        totalDisbursed: index * 500,
      });
    });

    const result = await handler.execute();

    expect(result.movements).toHaveLength(6);
    expect(result.movements[0].label).toBe('Ene');
    expect(result.movements[0].collected).toBe(1000);
    expect(result.movements[5].label).toBe('Jun');
    expect(result.movements[5].collected).toBe(6000);
  });

  it('should handle less than 6 closed meetings', async () => {
    const mockMeetings: Partial<Meeting>[] = [
      { id: '1', date: new Date('2024-01-15'), status: 'closed' },
      { id: '2', date: new Date('2024-02-15'), status: 'closed' },
    ];

    meetingRepository.findAll.mockResolvedValue(
      [...mockMeetings].reverse() as Meeting[],
    );

    meetingSummaryService.calculateSummary.mockResolvedValue({
      totalCollected: 1000,
      totalDisbursed: 500,
    });

    const result = await handler.execute();

    expect(result.movements).toHaveLength(2);
    expect(result.movements[0].label).toBe('Ene');
    expect(result.movements[1].label).toBe('Feb');
  });
});
