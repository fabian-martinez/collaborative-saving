import { CloseMeetingUseCase } from './close-meeting.use-case';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { CASH_ACCOUNT, ACCUMULATED_SURPLUS_ACCOUNT } from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

describe('CloseMeetingUseCase', () => {
  let useCase: CloseMeetingUseCase;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let findByMeetingSpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    saveSpy = jest.spyOn(meetingRepository, 'save');
    findByMeetingSpy = jest.spyOn(ledgerEntryRepository, 'findByMeeting');

    useCase = new CloseMeetingUseCase(
      meetingRepository,
      ledgerEntryRepository,
      recordOperationUseCase,
    );
  });

  it('should close a meeting successfully', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const meetingId = activeMeeting.id;

    meetingRepository.findById.mockResolvedValue(activeMeeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]); // No cash entries
    // Mock save to return a closed version
    // The use case will call close() on the meeting, then save it
    meetingRepository.save.mockImplementation(async (meeting) => {
      // Return the same meeting object (already closed by use case)
      return await Promise.resolve(meeting);
    });

    // ACT
    const result = await useCase.execute({ meetingId });

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingSpy).toHaveBeenCalledWith(meetingId);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(MeetingStatus.CLOSED);
    expect(result.id).toBe(meetingId);
  });

  it('should throw MeetingNotFoundException if meeting does not exist', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    meetingRepository.findById.mockResolvedValue(null);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    // ACT & ASSERT
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      MeetingNotFoundException,
    );
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      `Meeting with ID ${meetingId} not found`,
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should throw InvalidRequestError if meeting is already closed', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const closedMeeting = Meeting.create({});
    closedMeeting.close();

    meetingRepository.findById.mockResolvedValue(closedMeeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    // ACT & ASSERT
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      InvalidRequestError,
    );
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      'This meeting is already closed',
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should transfer cash balance to accumulated surplus when cash balance > 0', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const meetingId = activeMeeting.id;

    const ledgerEntries = [
      {
        id: 'entry-1',
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 500,
      },
      {
        id: 'entry-2',
        operationId: 'op-2',
        accountType: CASH_ACCOUNT,
        amount: 300,
      },
    ];

    meetingRepository.findById.mockResolvedValue(activeMeeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries as any);
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-surplus',
      ledgerEntryIds: [],
    });
    meetingRepository.save.mockImplementation(async (meeting) => {
      return await Promise.resolve(meeting);
    });

    // ACT
    const result = await useCase.execute({ meetingId });

    // ASSERT
    expect(recordOperationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: OperationType.SURPLUS_ACCUMULATION,
        entries: expect.arrayContaining([
          expect.objectContaining({
            accountType: ACCUMULATED_SURPLUS_ACCOUNT,
            amount: 800,
          }),
          expect.objectContaining({
            accountType: CASH_ACCOUNT,
            amount: -800,
          }),
        ]),
      }),
    );
    expect(result.status).toBe(MeetingStatus.CLOSED);
  });

  it('should include authorizedBy in description when provided', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const meetingId = activeMeeting.id;

    const ledgerEntries = [
      {
        id: 'entry-1',
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 500,
      },
    ];

    meetingRepository.findById.mockResolvedValue(activeMeeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries as any);
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-surplus',
      ledgerEntryIds: [],
    });
    meetingRepository.save.mockImplementation(async (meeting) => {
      return await Promise.resolve(meeting);
    });

    // ACT
    await useCase.execute({ meetingId, authorizedBy: 'John Doe' });

    // ASSERT
    expect(recordOperationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Autorizado por: John Doe'),
      }),
    );
  });

  it('should throw BusinessRuleError when cash balance is negative', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const meetingId = activeMeeting.id;

    const ledgerEntries = [
      {
        id: 'entry-1',
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: -100, // Negative balance
      },
    ];

    meetingRepository.findById.mockResolvedValue(activeMeeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries as any);

    // ACT & ASSERT
    await expect(useCase.execute({ meetingId })).rejects.toThrow(BusinessRuleError);
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      'El balance de efectivo no puede quedar negativo',
    );
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should not transfer when cash balance is 0', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const meetingId = activeMeeting.id;

    const ledgerEntries: any[] = []; // No cash entries

    meetingRepository.findById.mockResolvedValue(activeMeeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);
    meetingRepository.save.mockImplementation(async (meeting) => {
      return await Promise.resolve(meeting);
    });

    // ACT
    const result = await useCase.execute({ meetingId });

    // ASSERT
    expect(recordOperationUseCase.execute).not.toHaveBeenCalled();
    expect(result.status).toBe(MeetingStatus.CLOSED);
  });
});
