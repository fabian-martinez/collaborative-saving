import { GetRevaluationQueryHandler } from './get-revaluation.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { AssetRevaluationDomainService } from '@domain/services/asset-revaluation.service';
import { Meeting } from '@domain/entities/meeting.entity';
import { Operation } from '@domain/entities/operation.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';

describe('GetRevaluationQueryHandler', () => {
  let queryHandler: GetRevaluationQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let assetRevaluationDomainService: jest.Mocked<AssetRevaluationDomainService>;
  let findByIdSpy: jest.SpyInstance;
  let findByMeetingAndTypeSpy: jest.SpyInstance;
  let calculateRevaluationDataSpy: jest.SpyInstance;
  let getExecutedRevaluationDataSpy: jest.SpyInstance;

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
      findByMember: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    assetRevaluationDomainService = {
      calculateRevaluationData: jest.fn(),
      getExecutedRevaluationData: jest.fn(),
      validateRevaluationContext: jest.fn(),
    } as unknown as jest.Mocked<AssetRevaluationDomainService>;

    findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    findByMeetingAndTypeSpy = jest.spyOn(
      operationRepository,
      'findByMeetingAndType',
    );
    calculateRevaluationDataSpy = jest.spyOn(
      assetRevaluationDomainService,
      'calculateRevaluationData',
    );
    getExecutedRevaluationDataSpy = jest.spyOn(
      assetRevaluationDomainService,
      'getExecutedRevaluationData',
    );

    queryHandler = new GetRevaluationQueryHandler(
      meetingRepository,
      operationRepository,
      assetRevaluationDomainService,
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
    expect(findByMeetingAndTypeSpy).not.toHaveBeenCalled();
  });

  it('should return preview when no revaluation is executed', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const mockCalculationResult = {
      totalContributions: 10000,
      totalInterest: 5000,
      totalToDistribute: 15000,
      details: [
        {
          stockId: 'stock-1',
          type: 'Acción A',
          isGuaranteed: false,
          totalShares: 10,
          previousValue: 100,
          growthFromContributions: 5,
          growthFromInterest: 3,
          totalGrowthPerShare: 8,
          estimatedGrowthFromContributions: 2,
          newValue: 108,
        },
      ],
      totalMandatoryContributions: 2000,
      mandatoryContributionsByType: [],
    };

    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([]);
    calculateRevaluationDataSpy.mockResolvedValue(mockCalculationResult);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingAndTypeSpy).toHaveBeenCalledWith(
      meetingId,
      'ASSET_REVALUATION' as OperationType,
    );
    expect(calculateRevaluationDataSpy).toHaveBeenCalledWith(meetingId);
    expect(result).toEqual({
      ...mockCalculationResult,
      status: 'preview',
    });
    expect(result.status).toBe('preview');
    expect(result.executedAt).toBeUndefined();
    expect(result.operationId).toBeUndefined();
  });

  it('should return executed result when revaluation already exists', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });

    const operation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
      description: 'Revaluación ejecutada',
    });

    const mockExecutedResult = {
      totalContributions: 10000,
      totalInterest: 5000,
      totalToDistribute: 15000,
      details: [
        {
          stockId: 'stock-1',
          type: 'Acción A',
          isGuaranteed: false,
          totalShares: 10,
          previousValue: 100,
          growthFromContributions: 5,
          growthFromInterest: 3,
          totalGrowthPerShare: 8,
          estimatedGrowthFromContributions: 2,
          newValue: 108,
        },
      ],
      totalMandatoryContributions: 2000,
      mandatoryContributionsByType: [],
    };

    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([operation]);
    getExecutedRevaluationDataSpy.mockResolvedValue(mockExecutedResult);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(findByMeetingAndTypeSpy).toHaveBeenCalledWith(
      meetingId,
      'ASSET_REVALUATION' as OperationType,
    );
    expect(getExecutedRevaluationDataSpy).toHaveBeenCalledWith(
      operation.id,
      meetingId,
    );
    expect(calculateRevaluationDataSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      ...mockExecutedResult,
      status: 'executed',
      executedAt: operation.date.toISOString(),
      operationId: operation.id,
    });
    expect(result.status).toBe('executed');
    expect(result.executedAt).toBe(operation.date.toISOString());
    expect(result.operationId).toBe(operation.id);
  });

  it('should include status preview in result when it is preview', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const mockCalculationResult = {
      totalContributions: 5000,
      totalInterest: 3000,
      totalToDistribute: 8000,
      details: [],
      totalMandatoryContributions: 1000,
      mandatoryContributionsByType: [],
    };

    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([]);
    calculateRevaluationDataSpy.mockResolvedValue(mockCalculationResult);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result.status).toBe('preview');
    expect(result.executedAt).toBeUndefined();
    expect(result.operationId).toBeUndefined();
  });

  it('should include status executed, executedAt and operationId when executed', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const meeting = Meeting.create({
      date: new Date('2024-01-15T10:30:00Z'),
    });

    const operation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: new Date('2024-01-15T10:30:00Z'),
    });

    const mockExecutedResult = {
      totalContributions: 5000,
      totalInterest: 3000,
      totalToDistribute: 8000,
      details: [],
      totalMandatoryContributions: 1000,
      mandatoryContributionsByType: [],
    };

    findByIdSpy.mockResolvedValue(meeting);
    findByMeetingAndTypeSpy.mockResolvedValue([operation]);
    getExecutedRevaluationDataSpy.mockResolvedValue(mockExecutedResult);

    // ACT
    const result = await queryHandler.execute(meetingId);

    // ASSERT
    expect(result.status).toBe('executed');
    expect(result.executedAt).toBe(operation.date.toISOString());
    expect(result.operationId).toBe(operation.id);
  });
});
