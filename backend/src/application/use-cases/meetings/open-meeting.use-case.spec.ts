import { OpenMeetingUseCase } from './open-meeting.use-case';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

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
});
