import { OpenMeetingUseCase } from './open-meeting.use-case';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import {
  CASH_ACCOUNT,
  ACCUMULATED_SURPLUS_ACCOUNT,
} from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

describe('OpenMeetingUseCase', () => {
  let useCase: OpenMeetingUseCase;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let findActiveSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    };

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

    findActiveSpy = jest.spyOn(meetingRepository, 'findActive');
    saveSpy = jest.spyOn(meetingRepository, 'save');

    useCase = new OpenMeetingUseCase(
      meetingRepository,
      ledgerEntryRepository,
      recordOperationUseCase,
    );
  });

  it('should open a meeting successfully', async () => {
    // ARRANGE
    const openDto = {
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    };

    meetingRepository.findActive.mockResolvedValue(null);
    const savedMeeting = Meeting.create(openDto);
    meetingRepository.save.mockResolvedValue(savedMeeting);
    ledgerEntryRepository.sumByAccountType.mockResolvedValue(0); // No accumulated surplus

    // ACT
    const result = await useCase.execute(openDto);

    // ASSERT
    expect(findActiveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: savedMeeting.id,
      date: savedMeeting.date,
      status: savedMeeting.status,
      notes: savedMeeting.notes,
      createdAt: savedMeeting.createdAt,
    });
    expect(result.status).toBe(MeetingStatus.ACTIVE);
  });

  it('should open a meeting without optional fields', async () => {
    // ARRANGE
    const openDto = {};

    meetingRepository.findActive.mockResolvedValue(null);
    const savedMeeting = Meeting.create(openDto);
    meetingRepository.save.mockResolvedValue(savedMeeting);
    ledgerEntryRepository.sumByAccountType.mockResolvedValue(0); // No accumulated surplus

    // ACT
    const result = await useCase.execute(openDto);

    // ASSERT
    expect(result).toBeDefined();
    expect(result.status).toBe(MeetingStatus.ACTIVE);
    expect(result.notes).toBeNull();
  });

  it('should throw InvalidRequestError if active meeting exists', async () => {
    // ARRANGE
    const openDto = { date: new Date('2024-01-15') };
    const activeMeeting = Meeting.create({});
    meetingRepository.findActive.mockResolvedValue(activeMeeting);

    // ACT & ASSERT
    await expect(useCase.execute(openDto)).rejects.toThrow(InvalidRequestError);
    await expect(useCase.execute(openDto)).rejects.toThrow(
      'An active meeting already exists',
    );

    expect(findActiveSpy).toHaveBeenCalledTimes(2);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should transfer accumulated surplus to cash when surplus exists', async () => {
    // ARRANGE
    const openDto = {
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    };

    meetingRepository.findActive.mockResolvedValue(null);
    const savedMeeting = Meeting.create(openDto);
    meetingRepository.save.mockResolvedValue(savedMeeting);
    ledgerEntryRepository.sumByAccountType
      .mockResolvedValueOnce(500) // Accumulated surplus balance
      .mockResolvedValueOnce(1000); // Current cash balance

    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-transfer',
      ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
    });

    const sumByAccountTypeSpy = jest.spyOn(
      ledgerEntryRepository,
      'sumByAccountType',
    );
    const executeSpy = jest.spyOn(recordOperationUseCase, 'execute');

    // ACT
    const result = await useCase.execute(openDto);

    // ASSERT
    expect(sumByAccountTypeSpy).toHaveBeenCalledWith(
      ACCUMULATED_SURPLUS_ACCOUNT,
    );
    expect(sumByAccountTypeSpy).toHaveBeenCalledWith(CASH_ACCOUNT);
    expect(executeSpy).toHaveBeenCalled();
    const callArgs = executeSpy.mock.calls[0][0];
    expect(callArgs.type).toBe(OperationType.INITIAL_CASH_BALANCE);
    expect(callArgs.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountType: CASH_ACCOUNT,
          amount: 500,
        }),
        expect.objectContaining({
          accountType: ACCUMULATED_SURPLUS_ACCOUNT,
          amount: -500,
        }),
      ]),
    );
    expect(result.status).toBe(MeetingStatus.ACTIVE);
  });

  it('should throw BusinessRuleError when resulting cash balance would be negative', async () => {
    // ARRANGE
    const openDto = {
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    };

    meetingRepository.findActive.mockResolvedValue(null);
    const savedMeeting = Meeting.create(openDto);
    meetingRepository.save.mockResolvedValue(savedMeeting);
    ledgerEntryRepository.sumByAccountType
      .mockResolvedValueOnce(500) // Accumulated surplus balance
      .mockResolvedValueOnce(-600); // Current cash balance (negative)

    // ACT & ASSERT
    await expect(useCase.execute(openDto)).rejects.toThrow(BusinessRuleError);

    // Verify the error message in a separate call with reset mocks
    meetingRepository.findActive.mockResolvedValue(null);
    meetingRepository.save.mockResolvedValue(savedMeeting);
    ledgerEntryRepository.sumByAccountType
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(-600);

    try {
      await useCase.execute(openDto);
      fail('Expected BusinessRuleError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessRuleError);
      expect((error as BusinessRuleError).message).toContain(
        'El balance de efectivo no puede quedar negativo',
      );
    }
  });

  it('should not transfer when accumulated surplus is 0', async () => {
    // ARRANGE
    const openDto = {
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    };

    meetingRepository.findActive.mockResolvedValue(null);
    const savedMeeting = Meeting.create(openDto);
    meetingRepository.save.mockResolvedValue(savedMeeting);
    ledgerEntryRepository.sumByAccountType.mockResolvedValue(0); // No surplus

    const sumByAccountTypeSpy = jest.spyOn(
      ledgerEntryRepository,
      'sumByAccountType',
    );
    const executeSpy = jest.spyOn(recordOperationUseCase, 'execute');

    // ACT
    const result = await useCase.execute(openDto);

    // ASSERT
    expect(sumByAccountTypeSpy).toHaveBeenCalledWith(
      ACCUMULATED_SURPLUS_ACCOUNT,
    );
    expect(executeSpy).not.toHaveBeenCalled();
    expect(result.status).toBe(MeetingStatus.ACTIVE);
  });

  it('should not transfer when accumulated surplus is negative', async () => {
    // ARRANGE
    const openDto = {
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    };

    meetingRepository.findActive.mockResolvedValue(null);
    const savedMeeting = Meeting.create(openDto);
    meetingRepository.save.mockResolvedValue(savedMeeting);
    ledgerEntryRepository.sumByAccountType.mockResolvedValue(-100); // Negative surplus

    // ACT
    const result = await useCase.execute(openDto);

    // ASSERT
    const executeSpy = jest.spyOn(recordOperationUseCase, 'execute');
    expect(executeSpy).not.toHaveBeenCalled();
    expect(result.status).toBe(MeetingStatus.ACTIVE);
  });
});
