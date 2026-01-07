import { GetMeetingMonthlyPaymentsQueryHandler } from './get-meeting-monthly-payments.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { PaymentFilterType } from '@domain/enums/payment-filter-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { Meeting } from '@domain/entities/meeting.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';

describe('GetMeetingMonthlyPaymentsQueryHandler', () => {
  let queryHandler: GetMeetingMonthlyPaymentsQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let paymentMapperService: jest.Mocked<PaymentMapperService>;
  let findByIdSpy: jest.SpyInstance;
  let findByMeetingAndTypesSpy: jest.SpyInstance;
  let findByOperationsSpy: jest.SpyInstance;
  let calculatePaymentTotalAmountSpy: jest.SpyInstance;
  let mapPaymentFilterToOperationTypesSpy: jest.SpyInstance;

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
      findByMeetingAndTypes: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
      getAccountsSummary: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    paymentMapperService = {
      calculatePaymentTotalAmount: jest.fn(),
      mapPaymentFilterToOperationTypes: jest.fn(),
      mapOperationTypeToPaymentType: jest.fn(),
    } as unknown as jest.Mocked<PaymentMapperService>;

    findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    findByMeetingAndTypesSpy = jest.spyOn(
      operationRepository,
      'findByMeetingAndTypes',
    );
    findByOperationsSpy = jest.spyOn(ledgerEntryRepository, 'findByOperations');
    calculatePaymentTotalAmountSpy = jest.spyOn(
      paymentMapperService,
      'calculatePaymentTotalAmount',
    );
    mapPaymentFilterToOperationTypesSpy = jest.spyOn(
      paymentMapperService,
      'mapPaymentFilterToOperationTypes',
    );

    queryHandler = new GetMeetingMonthlyPaymentsQueryHandler(
      meetingRepository,
      operationRepository,
      ledgerEntryRepository,
      paymentMapperService,
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
    expect(findByMeetingAndTypesSpy).not.toHaveBeenCalled();
  });

  it('should return empty array when no monthly payments exist', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];
    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([]);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(mapPaymentFilterToOperationTypesSpy).toHaveBeenCalledWith(
      PaymentFilterType.MONTHLY_PAYMENT,
    );
    expect(findByMeetingAndTypesSpy).toHaveBeenCalledWith(
      meetingId,
      operationTypes,
    );
    expect(findByOperationsSpy).not.toHaveBeenCalled();
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
    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];

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

    const entry1 = LedgerEntry.create({
      operationId: operation1.id,
      accountType: CASH_ACCOUNT,
      amount: 100000,
      description: 'Cash entry 1',
    });

    const entry2 = LedgerEntry.create({
      operationId: operation2.id,
      accountType: CASH_ACCOUNT,
      amount: 150000,
      description: 'Cash entry 2',
    });

    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([operation1, operation2]);
    findByOperationsSpy.mockResolvedValue([entry1, entry2]);
    calculatePaymentTotalAmountSpy
      .mockReturnValueOnce(100000)
      .mockReturnValueOnce(150000);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(mapPaymentFilterToOperationTypesSpy).toHaveBeenCalledWith(
      PaymentFilterType.MONTHLY_PAYMENT,
    );
    expect(findByMeetingAndTypesSpy).toHaveBeenCalledWith(
      meetingId,
      operationTypes,
    );
    expect(findByOperationsSpy).toHaveBeenCalledWith([
      operation1.id,
      operation2.id,
    ]);
    expect(calculatePaymentTotalAmountSpy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: operation1.id,
      memberId: operation1.memberId,
      meetingId: operation1.meetingId,
      type: operation1.type,
      date: operation1.date,
      description: operation1.description,
      totalAmount: 100000,
    });
    expect(result[1]).toEqual({
      id: operation2.id,
      memberId: operation2.memberId,
      meetingId: operation2.meetingId,
      type: operation2.type,
      date: operation2.date,
      description: operation2.description,
      totalAmount: 150000,
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

    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];
    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([operation]);
    findByOperationsSpy.mockResolvedValue([]);
    calculatePaymentTotalAmountSpy.mockReturnValue(250000);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result[0]).toMatchObject({
      id: operation.id,
      memberId: memberId,
      meetingId: meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      description: 'Complete monthly payment',
      totalAmount: 250000,
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

    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];
    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([operation]);
    findByOperationsSpy.mockResolvedValue([]);
    calculatePaymentTotalAmountSpy.mockReturnValue(0);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result[0].memberId).toBeNull();
    expect(result[0].totalAmount).toBe(0);
  });

  it('should calculate totalAmount from ledger entries', async () => {
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
      date: new Date('2024-01-15'),
      description: 'Payment with entries',
    });

    const cashEntry1 = LedgerEntry.create({
      operationId: operation.id,
      accountType: CASH_ACCOUNT,
      amount: 50000,
      description: 'Cash entry 1',
    });

    const cashEntry2 = LedgerEntry.create({
      operationId: operation.id,
      accountType: CASH_ACCOUNT,
      amount: 200000,
      description: 'Cash entry 2',
    });

    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];
    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([operation]);
    findByOperationsSpy.mockResolvedValue([cashEntry1, cashEntry2]);
    calculatePaymentTotalAmountSpy.mockReturnValue(250000);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByOperationsSpy).toHaveBeenCalledWith([operation.id]);
    expect(calculatePaymentTotalAmountSpy).toHaveBeenCalledWith([
      cashEntry1,
      cashEntry2,
    ]);
    expect(result[0].totalAmount).toBe(250000);
  });

  it('should return totalAmount as 0 when no cash entries exist', async () => {
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
      date: new Date('2024-01-15'),
      description: 'Payment without cash entries',
    });

    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];
    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([operation]);
    findByOperationsSpy.mockResolvedValue([]);
    calculatePaymentTotalAmountSpy.mockReturnValue(0);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(calculatePaymentTotalAmountSpy).toHaveBeenCalledWith([]);
    expect(result[0].totalAmount).toBe(0);
  });

  it('should handle multiple operations with different totals', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const operation1 = Operation.create({
      memberId: 'member-1',
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Payment 1',
    });

    const operation2 = Operation.create({
      memberId: 'member-2',
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Payment 2',
    });

    const operation3 = Operation.create({
      memberId: 'member-3',
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Payment 3',
    });

    const entry1 = LedgerEntry.create({
      operationId: operation1.id,
      accountType: CASH_ACCOUNT,
      amount: 100000,
      description: 'Entry 1',
    });

    const entry2 = LedgerEntry.create({
      operationId: operation2.id,
      accountType: CASH_ACCOUNT,
      amount: 200000,
      description: 'Entry 2',
    });

    const entry3 = LedgerEntry.create({
      operationId: operation3.id,
      accountType: CASH_ACCOUNT,
      amount: 300000,
      description: 'Entry 3',
    });

    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];
    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([
      operation1,
      operation2,
      operation3,
    ]);
    findByOperationsSpy.mockResolvedValue([entry1, entry2, entry3]);
    calculatePaymentTotalAmountSpy
      .mockReturnValueOnce(100000)
      .mockReturnValueOnce(200000)
      .mockReturnValueOnce(300000);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result).toHaveLength(3);
    expect(result[0].totalAmount).toBe(100000);
    expect(result[1].totalAmount).toBe(200000);
    expect(result[2].totalAmount).toBe(300000);
    expect(calculatePaymentTotalAmountSpy).toHaveBeenCalledTimes(3);
  });

  it('should use PaymentMapperService.mapPaymentFilterToOperationTypes with MONTHLY_PAYMENT', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const expectedOperationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];

    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(expectedOperationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([]);

    // ACT
    await queryHandler.execute(meetingId);

    // ASSERT
    expect(mapPaymentFilterToOperationTypesSpy).toHaveBeenCalledWith(
      PaymentFilterType.MONTHLY_PAYMENT,
    );
    expect(findByMeetingAndTypesSpy).toHaveBeenCalledWith(
      meetingId,
      expectedOperationTypes,
    );
  });

  it('should include LOAN_PAYMENT operations in results', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const memberId = 'member-123';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];

    const loanPaymentOperation = Operation.create({
      memberId,
      meetingId,
      type: OperationType.LOAN_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Loan payment',
    });

    const entry = LedgerEntry.create({
      operationId: loanPaymentOperation.id,
      accountType: CASH_ACCOUNT,
      amount: 50000,
      description: 'Loan payment entry',
    });

    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([loanPaymentOperation]);
    findByOperationsSpy.mockResolvedValue([entry]);
    calculatePaymentTotalAmountSpy.mockReturnValue(50000);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(OperationType.LOAN_PAYMENT);
    expect(result[0].description).toBe('Loan payment');
    expect(result[0].totalAmount).toBe(50000);
  });

  it('should include operations of all monthly payment types', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];

    const operations = [
      Operation.create({
        memberId: 'member-1',
        meetingId,
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Monthly payment',
      }),
      Operation.create({
        memberId: 'member-2',
        meetingId,
        type: OperationType.MANDATORY_CONTRIBUTION,
        date: new Date('2024-01-15'),
        description: 'Mandatory contribution',
      }),
      Operation.create({
        memberId: 'member-3',
        meetingId,
        type: OperationType.STOCK_FEE,
        date: new Date('2024-01-15'),
        description: 'Stock fee',
      }),
      Operation.create({
        memberId: 'member-4',
        meetingId,
        type: OperationType.LOAN_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Loan payment',
      }),
      Operation.create({
        memberId: 'member-5',
        meetingId,
        type: OperationType.FEE,
        date: new Date('2024-01-15'),
        description: 'Fee',
      }),
      Operation.create({
        memberId: 'member-6',
        meetingId,
        type: OperationType.INSURANCE_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Insurance payment',
      }),
    ];

    const entries = operations.map((op) =>
      LedgerEntry.create({
        operationId: op.id,
        accountType: CASH_ACCOUNT,
        amount: 10000,
        description: 'Entry',
      }),
    );

    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue(operations);
    findByOperationsSpy.mockResolvedValue(entries);
    calculatePaymentTotalAmountSpy.mockReturnValue(10000);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result).toHaveLength(6);
    expect(result.map((r) => r.type)).toEqual([
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ]);
  });

  it('should group ledger entries correctly when there are multiple operation types', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const operationTypes = [
      OperationType.MONTHLY_PAYMENT,
      OperationType.MANDATORY_CONTRIBUTION,
      OperationType.STOCK_FEE,
      OperationType.LOAN_PAYMENT,
      OperationType.FEE,
      OperationType.INSURANCE_PAYMENT,
    ];

    const operation1 = Operation.create({
      memberId: 'member-1',
      meetingId,
      type: OperationType.MONTHLY_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Monthly payment',
    });

    const operation2 = Operation.create({
      memberId: 'member-2',
      meetingId,
      type: OperationType.LOAN_PAYMENT,
      date: new Date('2024-01-15'),
      description: 'Loan payment',
    });

    const entry1 = LedgerEntry.create({
      operationId: operation1.id,
      accountType: CASH_ACCOUNT,
      amount: 100000,
      description: 'Entry 1',
    });

    const entry2 = LedgerEntry.create({
      operationId: operation2.id,
      accountType: CASH_ACCOUNT,
      amount: 50000,
      description: 'Entry 2',
    });

    findByIdSpy.mockResolvedValue(meeting);
    mapPaymentFilterToOperationTypesSpy.mockReturnValue(operationTypes);
    findByMeetingAndTypesSpy.mockResolvedValue([operation1, operation2]);
    findByOperationsSpy.mockResolvedValue([entry1, entry2]);
    calculatePaymentTotalAmountSpy
      .mockReturnValueOnce(100000)
      .mockReturnValueOnce(50000);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByOperationsSpy).toHaveBeenCalledWith([
      operation1.id,
      operation2.id,
    ]);
    expect(calculatePaymentTotalAmountSpy).toHaveBeenCalledTimes(2);
    expect(calculatePaymentTotalAmountSpy).toHaveBeenNthCalledWith(1, [entry1]);
    expect(calculatePaymentTotalAmountSpy).toHaveBeenNthCalledWith(2, [entry2]);
    expect(result).toHaveLength(2);
    expect(result[0].totalAmount).toBe(100000);
    expect(result[1].totalAmount).toBe(50000);
  });
});
