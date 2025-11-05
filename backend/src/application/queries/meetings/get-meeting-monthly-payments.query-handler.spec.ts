import { GetMeetingMonthlyPaymentsQueryHandler } from './get-meeting-monthly-payments.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { Operation } from '@domain/entities/operation.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { Meeting } from '@domain/entities/meeting.entity';

describe('GetMeetingMonthlyPaymentsQueryHandler', () => {
  let queryHandler: GetMeetingMonthlyPaymentsQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let findByIdSpy: jest.SpyInstance;
  let findByMeetingAndTypeSpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    findByMeetingAndTypeSpy = jest.spyOn(
      operationRepository,
      'findByMeetingAndType',
    );

    queryHandler = new GetMeetingMonthlyPaymentsQueryHandler(
      meetingRepository,
      operationRepository,
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
    expect(findByMeetingAndTypeSpy).not.toHaveBeenCalled();
  });

  it('should return empty array when no monthly payments exist', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([]);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingAndTypeSpy).toHaveBeenCalledWith(
      meetingId,
      OperationType.MONTHLY_PAYMENT,
    );
    expect(result).toEqual([]);
  });

  it('should return list of monthly payments for meeting', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const memberId = 'member-123';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const operation1 = Operation.create({
      memberId,
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Payment 1',
    });

    const operation2 = Operation.create({
      memberId: 'member-456',
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Payment 2',
    });

    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([operation1, operation2]);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingAndTypeSpy).toHaveBeenCalledWith(
      meetingId,
      OperationType.MONTHLY_PAYMENT,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: operation1.id,
      memberId: operation1.memberId,
      meetingId: operation1.meetingId,
      type: operation1.type,
      date: operation1.date,
      description: operation1.description,
    });
    expect(result[1]).toEqual({
      id: operation2.id,
      memberId: operation2.memberId,
      meetingId: operation2.meetingId,
      type: operation2.type,
      date: operation2.date,
      description: operation2.description,
    });
  });

  it('should map all operation fields correctly', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const memberId = 'member-123';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const operation = Operation.create({
      memberId,
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15T10:30:00Z'),
      description: 'Complete monthly payment',
    });

    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([operation]);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result[0]).toMatchObject({
      id: operation.id,
      memberId: memberId,
      meetingId: meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      description: 'Complete monthly payment',
    });
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date).toEqual(new Date('2024-01-15T10:30:00Z'));
  });

  it('should handle operations with null memberId', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const operation = Operation.create({
      memberId: null,
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15'),
    });

    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([operation]);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result[0].memberId).toBeNull();
  });
});
