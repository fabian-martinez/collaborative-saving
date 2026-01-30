import { RecordRevaluationUseCase } from './record-revaluation.use-case';
import { RecordRevaluationDto } from '@application/dto/meetings/record-revaluation.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import {
  TransactionManager,
  TransactionContext,
} from '@domain/ports/services/transaction-manager.port';
import { AssetRevaluationDomainService } from '@domain/services/asset-revaluation.service';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { Meeting } from '@domain/entities/meeting.entity';
import { Operation } from '@domain/entities/operation.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';

describe('RecordRevaluationUseCase', () => {
  let useCase: RecordRevaluationUseCase;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let stockValueHistoryRepository: jest.Mocked<StockValueHistoryRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let assetRevaluationDomainService: jest.Mocked<AssetRevaluationDomainService>;
  let balanceValidator: OperationBalanceValidator;

  let transactionManagerExecuteSpy: jest.SpyInstance;
  let operationSaveSpy: jest.SpyInstance;
  let stockValueHistorySaveManySpy: jest.SpyInstance;
  let stockSaveSpy: jest.SpyInstance;
  let ledgerEntrySaveManySpy: jest.SpyInstance;
  let pendingPaymentSaveManySpy: jest.SpyInstance;
  let calculateRevaluationDataSpy: jest.SpyInstance;
  let validateBalanceSpy: jest.SpyInstance;

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

    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByMemberAndStock: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findFreeOfFinancing: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findByStock: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    stockValueHistoryRepository = {
      findById: jest.fn(),
      findByStock: jest.fn(),
      findByOperation: jest.fn(),
      findLatestByStock: jest.fn(),
      findByStockBeforeDate: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<StockValueHistoryRepository>;

    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      findByReference: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      calculateRemainingAmount: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    transactionManager = {
      execute: jest.fn(
        async <T>(
          operation: (context: TransactionContext) => Promise<T>,
        ): Promise<T> => {
          const context: TransactionContext = {
            execute: jest.fn(),
          };
          return await operation(context);
        },
      ),
    } as unknown as jest.Mocked<TransactionManager>;

    assetRevaluationDomainService = {
      calculateRevaluationData: jest.fn(),
      getExecutedRevaluationData: jest.fn(),
      validateRevaluationContext: jest.fn(),
    } as unknown as jest.Mocked<AssetRevaluationDomainService>;

    balanceValidator = new OperationBalanceValidator();

    transactionManagerExecuteSpy = jest.spyOn(transactionManager, 'execute');
    operationSaveSpy = jest.spyOn(operationRepository, 'save');
    stockValueHistorySaveManySpy = jest.spyOn(
      stockValueHistoryRepository,
      'saveMany',
    );
    stockSaveSpy = jest.spyOn(stockRepository, 'save');
    ledgerEntrySaveManySpy = jest.spyOn(ledgerEntryRepository, 'saveMany');
    pendingPaymentSaveManySpy = jest.spyOn(
      pendingMemberPaymentRepository,
      'saveMany',
    );
    calculateRevaluationDataSpy = jest.spyOn(
      assetRevaluationDomainService,
      'calculateRevaluationData',
    );
    validateBalanceSpy = jest.spyOn(balanceValidator, 'validateBalance');

    useCase = new RecordRevaluationUseCase(
      meetingRepository,
      operationRepository,
      ledgerEntryRepository,
      stockRepository,
      stockSubscriptionRepository,
      stockValueHistoryRepository,
      pendingMemberPaymentRepository,
      transactionManager,
      assetRevaluationDomainService,
      balanceValidator,
    );
  });

  it('should throw MeetingNotFoundException when meeting does not exist', async () => {
    // ARRANGE
    const dto: RecordRevaluationDto = {
      meetingId: '550e8400-e29b-41d4-a716-446655440000',
    };
    meetingRepository.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(useCase.execute(dto)).rejects.toThrow(
      MeetingNotFoundException,
    );
    expect(transactionManagerExecuteSpy).toHaveBeenCalledTimes(1);
  });

  it('should return existing result when revaluation already executed (idempotent)', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const existingOperation = Operation.create({
      meetingId,
      type: OperationType.ASSET_REVALUATION,
      date: meeting.date,
    });

    const mockExecutedResult = {
      totalContributions: 10000,
      totalInterest: 5000,
      totalToDistribute: 15000,
      details: [
        {
          stockId: 'stock-1',
          name: 'Acción A',
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

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([
      existingOperation,
    ]);
    assetRevaluationDomainService.getExecutedRevaluationData.mockResolvedValue(
      mockExecutedResult,
    );

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(result.status).toBe('executed');
    expect(result.operationId).toBe(existingOperation.id);
    expect(result.executedAt).toBe(existingOperation.date.toISOString());
    expect(calculateRevaluationDataSpy).not.toHaveBeenCalled();
    expect(operationSaveSpy).not.toHaveBeenCalled();
  });

  it('should execute new revaluation successfully', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const regularStock = Stock.create({
      name: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const mockCalculationResult = {
      totalContributions: 100,
      totalInterest: 500,
      totalToDistribute: 600,
      details: [
        {
          stockId: regularStock.id,
          name: 'regular',
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
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    stockRepository.findById.mockResolvedValue(regularStock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockResolvedValue(regularStock);
    ledgerEntryRepository.saveMany.mockResolvedValue([]);

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(result.status).toBe('executed');
    expect(result.operationId).toBe(savedOperation.id);
    expect(operationSaveSpy).toHaveBeenCalled();
    expect(stockValueHistorySaveManySpy).toHaveBeenCalled();
    expect(stockSaveSpy).toHaveBeenCalled();
    expect(ledgerEntrySaveManySpy).toHaveBeenCalled();
  });

  it('should create revaluation operation', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const stock = Stock.create({
      name: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const mockCalculationResult = {
      totalContributions: 100,
      totalInterest: 30,
      totalToDistribute: 130,
      details: [
        {
          stockId: stock.id,
          name: 'regular',
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
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockImplementation((op) => {
      expect(op.type).toBe(OperationType.ASSET_REVALUATION);
      expect(op.meetingId).toBe(meetingId);
      return Promise.resolve(savedOperation);
    });
    stockRepository.findById.mockResolvedValue(stock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockResolvedValue(stock);
    // The use case will create balanced ledger entries based on the calculation result
    // Mock the saveMany to return the entries that would be created
    ledgerEntryRepository.saveMany.mockImplementation((entries) => {
      // Verify entries are balanced
      if (entries.length > 0) {
        const totalDebits = entries
          .filter((e) => e.amount > 0)
          .reduce((sum, e) => sum + e.amount, 0);
        const totalCredits = entries
          .filter((e) => e.amount < 0)
          .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
      }
      return Promise.resolve(entries);
    });

    // ACT
    await useCase.execute(dto);

    // ASSERT
    expect(operationSaveSpy).toHaveBeenCalled();
  });

  it('should create stock value histories', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const stock = Stock.create({
      name: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const mockCalculationResult = {
      totalContributions: 100,
      totalInterest: 30,
      totalToDistribute: 130,
      details: [
        {
          stockId: stock.id,
          name: 'regular',
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
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    stockRepository.findById.mockResolvedValue(stock);
    stockValueHistoryRepository.saveMany.mockImplementation((histories) => {
      expect(histories).toHaveLength(1);
      expect(histories[0].stockId).toBe(stock.id);
      expect(histories[0].operationId).toBe(savedOperation.id);
      expect(histories[0].previousValue).toBe(100);
      expect(histories[0].newValue).toBe(108);
      return Promise.resolve(histories);
    });
    stockRepository.save.mockResolvedValue(stock);
    // The use case will create balanced ledger entries
    ledgerEntryRepository.saveMany.mockImplementation((entries) => {
      if (entries.length > 0) {
        const totalDebits = entries
          .filter((e) => e.amount > 0)
          .reduce((sum, e) => sum + e.amount, 0);
        const totalCredits = entries
          .filter((e) => e.amount < 0)
          .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
      }
      return Promise.resolve(entries);
    });

    // ACT
    await useCase.execute(dto);

    // ASSERT
    expect(stockValueHistorySaveManySpy).toHaveBeenCalled();
  });

  it('should update stock values', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const stock = Stock.create({
      name: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const mockCalculationResult = {
      totalContributions: 100,
      totalInterest: 30,
      totalToDistribute: 130,
      details: [
        {
          stockId: stock.id,
          name: 'regular',
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
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    // Mock stockRepository.findById for all calls:
    // 1. For history creation (line 101)
    // 2. For value update (line 152)
    // 3. For ledger entries creation (line 170)
    stockRepository.findById.mockResolvedValue(stock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockImplementation((s) => {
      expect(s.value).toBe(108);
      return Promise.resolve(s);
    });
    // The use case will create balanced ledger entries based on growth
    ledgerEntryRepository.saveMany.mockImplementation((entries) => {
      if (entries.length > 0) {
        const totalDebits = entries
          .filter((e) => e.amount > 0)
          .reduce((sum, e) => sum + e.amount, 0);
        const totalCredits = entries
          .filter((e) => e.amount < 0)
          .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
      }
      return Promise.resolve(entries);
    });

    // ACT
    await useCase.execute(dto);

    // ASSERT
    expect(stockSaveSpy).toHaveBeenCalled();
  });

  it('should create balanced ledger entries', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const stock = Stock.create({
      name: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const mockCalculationResult = {
      totalContributions: 100,
      totalInterest: 30,
      totalToDistribute: 130,
      details: [
        {
          stockId: stock.id,
          name: 'regular',
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
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    stockRepository.findById.mockResolvedValue(stock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockResolvedValue(stock);
    ledgerEntryRepository.saveMany.mockImplementation((entries) => {
      // Verify entries are balanced
      const totalDebits = entries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      const totalCredits = entries
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
      return Promise.resolve(entries);
    });

    // ACT
    await useCase.execute(dto);

    // ASSERT
    expect(ledgerEntrySaveManySpy).toHaveBeenCalled();
  });

  it('should create pending dividend payments for DIVIDEND_YIELD stocks', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const dividendStock = Stock.create({
      name: 'dividend',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const subscription1 = StockSubscription.create({
      memberId: 'member-1',
      stockId: dividendStock.id,
      quantity: 6,
    });

    const subscription2 = StockSubscription.create({
      memberId: 'member-2',
      stockId: dividendStock.id,
      quantity: 4,
    });

    const mockCalculationResult = {
      totalContributions: 0,
      totalInterest: 500,
      totalToDistribute: 500,
      details: [
        {
          stockId: dividendStock.id,
          name: 'dividend',
          isGuaranteed: false,
          totalShares: 10,
          previousValue: 100,
          growthFromContributions: 0,
          growthFromInterest: 0,
          totalGrowthPerShare: 0,
          estimatedGrowthFromContributions: 0,
          newValue: 100,
          dividendsGenerated: 50, // 500 / 10 shares
        },
      ],
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    stockRepository.findById.mockResolvedValue(dividendStock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockResolvedValue(dividendStock);
    stockSubscriptionRepository.findByStock.mockResolvedValue([
      subscription1,
      subscription2,
    ]);
    pendingMemberPaymentRepository.saveMany.mockImplementation((payments) => {
      expect(payments).toHaveLength(2);
      expect(payments[0].type).toBe('dividend');
      expect(payments[0].memberId).toBe('member-1');
      expect(payments[1].memberId).toBe('member-2');
      return Promise.resolve(payments);
    });
    ledgerEntryRepository.saveMany.mockResolvedValue([]);

    // ACT
    await useCase.execute(dto);

    // ASSERT
    expect(pendingPaymentSaveManySpy).toHaveBeenCalled();
  });

  it('should handle guaranteed stocks correctly', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const guaranteedStock = Stock.create({
      name: 'guaranteed',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: true,
      guaranteedYield: 0.05,
    });

    const mockCalculationResult = {
      totalContributions: 0,
      totalInterest: 50,
      totalToDistribute: 50,
      details: [
        {
          stockId: guaranteedStock.id,
          name: 'guaranteed',
          isGuaranteed: true,
          totalShares: 10,
          previousValue: 100,
          growthFromContributions: 0,
          growthFromInterest: 5,
          totalGrowthPerShare: 5,
          estimatedGrowthFromContributions: 0,
          newValue: 105,
        },
      ],
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    stockRepository.findById.mockResolvedValue(guaranteedStock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockResolvedValue(guaranteedStock);
    ledgerEntryRepository.saveMany.mockResolvedValue([]);

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(result.status).toBe('executed');
    expect(stockSaveSpy).toHaveBeenCalled();
  });

  it('should handle regular stocks correctly', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const regularStock = Stock.create({
      name: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const mockCalculationResult = {
      totalContributions: 100,
      totalInterest: 30,
      totalToDistribute: 130,
      details: [
        {
          stockId: regularStock.id,
          name: 'regular',
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
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    stockRepository.findById.mockResolvedValue(regularStock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockResolvedValue(regularStock);
    ledgerEntryRepository.saveMany.mockResolvedValue([]);

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(result.status).toBe('executed');
    expect(result.details[0].growthFromContributions).toBe(5);
    expect(result.details[0].growthFromInterest).toBe(3);
  });

  it('should validate balance of ledger entries', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const dto: RecordRevaluationDto = { meetingId };
    const meeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    const stock = Stock.create({
      name: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const mockCalculationResult = {
      totalContributions: 100,
      totalInterest: 30,
      totalToDistribute: 130,
      details: [
        {
          stockId: stock.id,
          name: 'regular',
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
      totalMandatoryContributions: 0,
      mandatoryContributionsByType: [],
    };

    const savedOperation = Operation.create({
      meetingId,
      type: 'ASSET_REVALUATION' as OperationType,
      date: meeting.date,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    operationRepository.findByMeetingAndType.mockResolvedValue([]);
    assetRevaluationDomainService.calculateRevaluationData.mockResolvedValue(
      mockCalculationResult,
    );
    operationRepository.save.mockResolvedValue(savedOperation);
    stockRepository.findById.mockResolvedValue(stock);
    stockValueHistoryRepository.saveMany.mockResolvedValue([]);
    stockRepository.save.mockResolvedValue(stock);
    ledgerEntryRepository.saveMany.mockResolvedValue([]);

    // ACT
    await useCase.execute(dto);

    // ASSERT
    expect(validateBalanceSpy).toHaveBeenCalled();
  });
});
