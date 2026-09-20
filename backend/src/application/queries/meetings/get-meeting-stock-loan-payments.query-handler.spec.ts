import { GetMeetingStockLoanPaymentsQueryHandler } from './get-meeting-stock-loan-payments.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { Operation } from '@domain/entities/operation.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { Meeting } from '@domain/entities/meeting.entity';

describe('GetMeetingStockLoanPaymentsQueryHandler', () => {
  let queryHandler: GetMeetingStockLoanPaymentsQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let paymentMapperService: jest.Mocked<PaymentMapperService>;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    };

    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    ledgerEntryRepository = {
      findByOperations: jest.fn(),
      findById: jest.fn(),
      findByOperation: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    paymentMapperService = {
      calculateStockOperationTotalAmount: jest.fn(),
    } as unknown as jest.Mocked<PaymentMapperService>;

    queryHandler = new GetMeetingStockLoanPaymentsQueryHandler(
      meetingRepository,
      operationRepository,
      ledgerEntryRepository,
      paymentMapperService,
    );
  });

  it('should throw MeetingNotFoundException when meeting does not exist', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    meetingRepository.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(queryHandler.execute(meetingId)).rejects.toThrow(
      MeetingNotFoundException,
    );
    const findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    const findByMeetingAndTypeSpy = jest.spyOn(
      operationRepository,
      'findByMeetingAndType',
    );
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingAndTypeSpy).not.toHaveBeenCalled();
  });

  it('should return empty array when no stock loan payments exist', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    const findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    const findByMeetingAndTypeSpy = jest.spyOn(
      operationRepository,
      'findByMeetingAndType',
    );
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingAndTypeSpy).toHaveBeenCalledWith(
      meetingId,
      OperationType.STOCK_LOAN_PAYMENT,
    );
    expect(result).toEqual([]);
  });

  it('should return list of stock loan payments for meeting', async () => {
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
      type: OperationType.STOCK_LOAN_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Stock loan payment 1',
    });

    const operation2 = Operation.create({
      memberId: 'member-456',
      meetingId,
      type: OperationType.STOCK_LOAN_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Stock loan payment 2',
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([
      operation1,
      operation2,
    ]);
    ledgerEntryRepository.findByOperations.mockResolvedValue([]);
    paymentMapperService.calculateStockOperationTotalAmount.mockReturnValue(
      300,
    );

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    const findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    const findByMeetingAndTypeSpy = jest.spyOn(
      operationRepository,
      'findByMeetingAndType',
    );
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingAndTypeSpy).toHaveBeenCalledWith(
      meetingId,
      OperationType.STOCK_LOAN_PAYMENT,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: operation1.id,
      memberId: operation1.memberId,
      meetingId: operation1.meetingId,
      type: operation1.type,
      date: operation1.date,
      description: operation1.description,
      totalAmount: 300,
      entries: [],
    });
    expect(result[1]).toEqual({
      id: operation2.id,
      memberId: operation2.memberId,
      meetingId: operation2.meetingId,
      type: operation2.type,
      date: operation2.date,
      description: operation2.description,
      totalAmount: 300,
      entries: [],
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
      type: OperationType.STOCK_LOAN_PAYMENT,
      date: new Date('2024-01-15T10:30:00Z'),
      description: 'Complete stock loan payment',
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([operation]);
    ledgerEntryRepository.findByOperations.mockResolvedValue([]);
    paymentMapperService.calculateStockOperationTotalAmount.mockReturnValue(
      1000,
    );

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result[0]).toMatchObject({
      id: operation.id,
      memberId: memberId,
      meetingId: meetingId,
      type: OperationType.STOCK_LOAN_PAYMENT,
      description: 'Complete stock loan payment',
      totalAmount: 1000,
      entries: [],
    });
    expect(result[0].date).toBeInstanceOf(Date);
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
      type: OperationType.STOCK_LOAN_PAYMENT,
      date: new Date('2024-01-15'),
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([operation]);
    ledgerEntryRepository.findByOperations.mockResolvedValue([]);
    paymentMapperService.calculateStockOperationTotalAmount.mockReturnValue(0);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result[0].memberId).toBeNull();
    expect(result[0].totalAmount).toBe(0);
    expect(result[0].entries).toEqual([]);
  });
});
