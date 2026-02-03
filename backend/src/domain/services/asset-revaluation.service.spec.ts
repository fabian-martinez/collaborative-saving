import { AssetRevaluationDomainService } from './asset-revaluation.service';
import { MeetingRepository } from '../ports/repositories/meeting-repository.port';
import { LedgerEntryRepository } from '../ports/repositories/ledger-entry-repository.port';
import { StockRepository } from '../ports/repositories/stock-repository.port';
import { StockTypeRepository } from '../ports/repositories/stock-type-repository.port';
import { StockSubscriptionRepository } from '../ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '../ports/repositories/loan-repository.port';
import { OperationRepository } from '../ports/repositories/operation-repository.port';
import { StockValueHistoryRepository } from '../ports/repositories/stock-value-history-repository.port';
import { InterestDistributionConfigRepository } from '../ports/repositories/interest-distribution-config-repository.port';
import { Meeting } from '../entities/meeting.entity';
import { Stock, StockBehavior } from '../entities/stock.entity';
import { StockSubscription } from '../entities/stock-subscription.entity';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { Loan } from '../entities/loan.entity';
import { Operation } from '../entities/operation.entity';
import { OperationType } from '../enums/operation-type.enum';
import { StockValueHistory } from '../entities/stock-value-history.entity';
import {
  INTEREST_INCOME_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  DIVIDENDS_PAYABLE_ACCOUNT,
} from '../constants/account-types';
import { NotFoundError } from '../errors/not-found.error';
import { InvalidRequestError } from '../errors/invalid-request.error';
import { StockType } from '@domain/entities/stock-type.entity';

describe('AssetRevaluationDomainService', () => {
  let service: AssetRevaluationDomainService;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let stockValueHistoryRepository: jest.Mocked<StockValueHistoryRepository>;
  let distributionConfigRepository: jest.Mocked<InterestDistributionConfigRepository>;

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

    stockRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;

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

    loanRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMember: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    stockValueHistoryRepository = {
      findById: jest.fn(),
      findByStock: jest.fn(),
      findByOperation: jest.fn(),
      findLatestByStock: jest.fn(),
      findByStockBeforeDate: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<StockValueHistoryRepository>;

    distributionConfigRepository = {
      findAll: jest.fn(),
      findByLoanType: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InterestDistributionConfigRepository>;

    distributionConfigRepository.findAll.mockResolvedValue([]);
    stockTypeRepository.findAll.mockResolvedValue([]);

    service = new AssetRevaluationDomainService(
      meetingRepository,
      ledgerEntryRepository,
      stockRepository,
      stockTypeRepository,
      stockSubscriptionRepository,
      loanRepository,
      operationRepository,
      stockValueHistoryRepository,
      distributionConfigRepository,
    );
  });

  describe('calculateRevaluationData', () => {
    it('should throw NotFoundError when meeting does not exist', async () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      meetingRepository.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.calculateRevaluationData(meetingId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.calculateRevaluationData(meetingId)).rejects.toThrow(
        `Meeting with ID ${meetingId} not found`,
      );
    });

    it('should calculate revaluation correctly with regular stocks', async () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const meeting = Meeting.create({
        date: new Date('2024-01-15'),
      });

      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });

      const regularStock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id,
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: regularStock.id,
        quantity: 10,
      });

      const meetingDate = new Date('2024-01-15');
      const monthlyPaymentOperation = Operation.create({
        meetingId,
        type: 'MONTHLY_PAYMENT' as OperationType,
        date: meetingDate,
      });

      const interestEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -500, // Credit (negative)
      });

      const contributionEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -100, // Credit (negative)
        stockId: regularStock.id,
      });

      meetingRepository.findById.mockResolvedValue(meeting);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        interestEntry,
        contributionEntry,
      ]);
      operationRepository.findByMeeting.mockResolvedValue([
        monthlyPaymentOperation,
      ]);
      stockRepository.findAll.mockResolvedValue([regularStock]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      loanRepository.findByIds.mockResolvedValue([]);

      // ACT
      const result = await service.calculateRevaluationData(meetingId);

      // ASSERT
      expect(result.totalInterest).toBe(500);
      expect(result.totalContributions).toBe(100);
      expect(result.totalToDistribute).toBe(600);
      expect(result.details).toHaveLength(1);
      expect(result.details[0].stockId).toBe(regularStock.id);
      expect(result.details[0].growthFromContributions).toBe(10); // 100 / 10 shares
      expect(result.details[0].previousValue).toBe(100);
    });

    it('should calculate revaluation correctly with guaranteed stocks', async () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const meeting = Meeting.create({
        date: new Date('2024-01-15'),
      });

      const stockType = StockType.create({
        id: 'guaranteed',
        name: 'guaranteed',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: true,
        guaranteedYield: 0.05,
      });

      const guaranteedStock = Stock.create({
        name: 'guaranteed',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id,
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: guaranteedStock.id,
        quantity: 10,
      });

      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'agil',
        approvedAmount: 1000,
        monthlyPaymentAmount: 100,
        interestRate: 0.02,
        term: 12,
      });

      const meetingDate = new Date('2024-01-15');
      const monthlyPaymentOperation = Operation.create({
        meetingId,
        type: 'MONTHLY_PAYMENT' as OperationType,
        date: meetingDate,
      });

      const interestEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -500, // Credit
        loanId: loan.id,
      });

      meetingRepository.findById.mockResolvedValue(meeting);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([interestEntry]);
      operationRepository.findByMeeting.mockResolvedValue([
        monthlyPaymentOperation,
      ]);
      stockRepository.findAll.mockResolvedValue([guaranteedStock]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      stockTypeRepository.findAll.mockResolvedValue([stockType]);
      loanRepository.findByIds.mockResolvedValue([loan]);

      // ACT
      const result = await service.calculateRevaluationData(meetingId);

      // ASSERT
      expect(result.totalInterest).toBe(500);
      expect(result.details).toHaveLength(1);
      expect(result.details[0].isGuaranteed).toBe(true);
    });

    it('should calculate revaluation correctly with DIVIDEND_YIELD stocks', async () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const meeting = Meeting.create({
        date: new Date('2024-01-15'),
      });

      const dividendStockType = {
        id: 'dividend-type-id',
        name: 'dividend',
        behavior: StockBehavior.DIVIDEND_YIELD,
      };

      const dividendStock = Stock.create({
        name: 'dividend',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: dividendStockType.id,
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: dividendStock.id,
        quantity: 10,
      });

      const meetingDate = new Date('2024-01-15');
      const monthlyPaymentOperation = Operation.create({
        meetingId,
        type: 'MONTHLY_PAYMENT' as OperationType,
        date: meetingDate,
      });

      const interestEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -500,
      });

      meetingRepository.findById.mockResolvedValue(meeting);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([interestEntry]);
      operationRepository.findByMeeting.mockResolvedValue([
        monthlyPaymentOperation,
      ]);
      stockRepository.findAll.mockResolvedValue([dividendStock]);
      stockTypeRepository.findAll.mockResolvedValue([dividendStockType as any]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      loanRepository.findByIds.mockResolvedValue([]);

      // ACT
      const result = await service.calculateRevaluationData(meetingId);

      // ASSERT
      expect(result.details).toHaveLength(1);
      expect(result.details[0].growthFromInterest).toBe(0); // Should be 0 for DIVIDEND_YIELD
      expect(result.details[0].dividendsGenerated).toBeDefined();
    });

    it('should calculate interest from agile and priority loans', async () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const meeting = Meeting.create({
        date: new Date('2024-01-15'),
      });

      const agileLoan = Loan.create({
        memberId: 'member-1',
        loanType: 'agil',
        approvedAmount: 1000,
        monthlyPaymentAmount: 100,
        interestRate: 0.02,
        term: 12,
      });

      const priorityLoan = Loan.create({
        memberId: 'member-2',
        loanType: 'prioritario',
        approvedAmount: 2000,
        monthlyPaymentAmount: 200,
        interestRate: 0.03,
        term: 12,
      });

      const regularLoan = Loan.create({
        memberId: 'member-3',
        loanType: 'regular',
        approvedAmount: 3000,
        monthlyPaymentAmount: 300,
        interestRate: 0.01,
        term: 12,
      });

      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });

      const stock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock.id,
        quantity: 10,
      });

      const meetingDate = new Date('2024-01-15');
      const monthlyPaymentOperation = Operation.create({
        meetingId,
        type: 'MONTHLY_PAYMENT' as OperationType,
        date: meetingDate,
      });

      const agileInterestEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -200,
        loanId: agileLoan.id,
      });

      const priorityInterestEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -300,
        loanId: priorityLoan.id,
      });

      const regularInterestEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -100,
        loanId: regularLoan.id,
      });

      meetingRepository.findById.mockResolvedValue(meeting);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        agileInterestEntry,
        priorityInterestEntry,
        regularInterestEntry,
      ]);
      operationRepository.findByMeeting.mockResolvedValue([
        monthlyPaymentOperation,
      ]);
      stockRepository.findAll.mockResolvedValue([stock]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      loanRepository.findByIds.mockResolvedValue([
        agileLoan,
        priorityLoan,
        regularLoan,
      ]);

      // ACT
      const result = await service.calculateRevaluationData(meetingId);

      // ASSERT
      expect(result.totalInterest).toBe(600); // 200 + 300 + 100
      // Agile/priority interest is calculated internally and used in distribution
    });

    it('should calculate mandatory contributions correctly', async () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const meeting = Meeting.create({
        date: new Date('2024-01-15'),
      });
      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });

      const stock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock.id,
        quantity: 10,
      });

      const meetingDate = new Date('2024-01-15');
      const monthlyPaymentOperation = Operation.create({
        meetingId,
        type: 'MONTHLY_PAYMENT' as OperationType,
        date: meetingDate,
      });

      const mandatoryContribution1 = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
        amount: -500,
        mandatoryContributionId: 'mandatory-1',
      });

      const mandatoryContribution2 = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
        amount: -300,
        mandatoryContributionId: 'mandatory-1',
      });

      const mandatoryContribution3 = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
        amount: -200,
        mandatoryContributionId: 'mandatory-2',
      });

      meetingRepository.findById.mockResolvedValue(meeting);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        mandatoryContribution1,
        mandatoryContribution2,
        mandatoryContribution3,
      ]);
      operationRepository.findByMeeting.mockResolvedValue([
        monthlyPaymentOperation,
      ]);
      stockRepository.findAll.mockResolvedValue([stock]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      loanRepository.findByIds.mockResolvedValue([]);

      // ACT
      const result = await service.calculateRevaluationData(meetingId);

      // ASSERT
      expect(result.totalMandatoryContributions).toBe(1000); // 500 + 300 + 200
      expect(result.mandatoryContributionsByType).toHaveLength(2);
      expect(
        result.mandatoryContributionsByType.find(
          (m) => m.mandatoryContributionId === 'mandatory-1',
        )?.total,
      ).toBe(800); // 500 + 300
      expect(
        result.mandatoryContributionsByType.find(
          (m) => m.mandatoryContributionId === 'mandatory-2',
        )?.total,
      ).toBe(200);
    });

    it('should return details sorted by type', async () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const meeting = Meeting.create({
        date: new Date('2024-01-15'),
      });

      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });

      const stockA = Stock.create({
        name: 'Acción Z',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });

      const stockB = Stock.create({
        name: 'Acción A',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });

      const subscriptionA = StockSubscription.create({
        memberId: 'member-1',
        stockId: stockA.id,
        quantity: 10,
      });

      const subscriptionB = StockSubscription.create({
        memberId: 'member-2',
        stockId: stockB.id,
        quantity: 10,
      });

      meetingRepository.findById.mockResolvedValue(meeting);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([]);
      operationRepository.findByMeeting.mockResolvedValue([]);
      stockRepository.findAll.mockResolvedValue([stockA, stockB]);
      stockSubscriptionRepository.findByStock
        .mockResolvedValueOnce([subscriptionA])
        .mockResolvedValueOnce([subscriptionB]);
      loanRepository.findByIds.mockResolvedValue([]);

      // ACT
      const result = await service.calculateRevaluationData(meetingId);

      // ASSERT
      expect(result.details).toHaveLength(2);
      expect(result.details[0].name).toBe('Acción A');
      expect(result.details[1].name).toBe('Acción Z');
    });
  });

  describe('validateRevaluationContext', () => {
    it('should throw error when no stocks available', () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const stocks: Stock[] = [];
      const subscriptions: StockSubscription[] = [];
      const totalInterest = 1000;

      // ACT & ASSERT
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          stocks,
          subscriptions,
          new Map(),
        ),
      ).toThrow(InvalidRequestError);
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          stocks,
          subscriptions,
          new Map(),
        ),
      ).toThrow('No stocks available for revaluation.');
    });

    it('should throw error when no active subscriptions found', () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });
      const stock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });
      const inactiveSubscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock.id,
        quantity: 0, // Inactive
      });
      inactiveSubscription.markAsInactive();
      const totalInterest = 1000;

      // ACT & ASSERT
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          [stock],
          [inactiveSubscription],
          new Map([[stockType.id, stockType]]),
        ),
      ).toThrow(InvalidRequestError);
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          [stock],
          [inactiveSubscription],
          new Map([[stockType.id, stockType]]),
        ),
      ).toThrow('No active stock subscriptions found.');
    });

    it('should throw error when total interest is negative', () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
        const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });
      const stock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock.id,
        quantity: 10,
      });
      const totalInterest = -100;

      // ACT & ASSERT
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          [stock],
          [subscription],
          new Map([[stockType.id, stockType]]),
        ),
      ).toThrow(InvalidRequestError);
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          [stock],
          [subscription],
          new Map([[stockType.id, stockType]]),
        ),
      ).toThrow('Total interest cannot be negative.');
    });

    it('should throw error when guaranteed stock has no positive yield', () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const stockType = StockType.create({
        id: 'guaranteed',
        name: 'guaranteed',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: true,
        guaranteedYield: null,
      });
      const guaranteedStock = Stock.create({
        name: 'guaranteed',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: guaranteedStock.id,
        quantity: 10,
      });
      const totalInterest = 1000;

      // ACT & ASSERT
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          [guaranteedStock],
          [subscription],
          new Map([[stockType.id, stockType]]),
        ),
      ).toThrow(InvalidRequestError);
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          [guaranteedStock],
          [subscription],
          new Map([[stockType.id, stockType]]),
        ),
      ).toThrow('must have a positive guaranteed yield');
    });

    it('should validate correctly when context is valid', () => {
      // ARRANGE
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });
      const stock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock.id,
        quantity: 10,
      });
      const totalInterest = 1000;

      // ACT & ASSERT
      expect(() =>
        service.validateRevaluationContext(
          meetingId,
          totalInterest,
          [stock],
          [subscription],
          new Map([[stockType.id, stockType]]),
        ),
      ).not.toThrow();
    });
  });

  describe('getExecutedRevaluationData', () => {
    it('should get executed revaluation data correctly', async () => {
      // ARRANGE
      const operationId = 'operation-1';
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });

      const stock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock.id,
        quantity: 10,
      });

      const stockHistory = StockValueHistory.create({
        stockId: stock.id,
        operationId,
        previousValue: 100,
        growthFromContributions: 5,
        growthFromInterest: 3,
        totalGrowthPerShare: 8,
        newValue: 108,
      });

      const meetingDate = new Date('2024-01-15');
      const monthlyPaymentOperation = Operation.create({
        meetingId,
        type: 'MONTHLY_PAYMENT' as OperationType,
        date: meetingDate,
      });

      const contributionEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -100,
        stockId: stock.id,
      });

      const interestEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -500,
      });

      stockValueHistoryRepository.findByOperation.mockResolvedValue([
        stockHistory,
      ]);
      stockRepository.findAll.mockResolvedValue([stock]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        contributionEntry,
        interestEntry,
      ]);
      operationRepository.findByMeeting.mockResolvedValue([
        monthlyPaymentOperation,
      ]);

      // ACT
      const result = await service.getExecutedRevaluationData(
        operationId,
        meetingId,
      );

      // ASSERT
      expect(result.details).toHaveLength(1);
      expect(result.details[0].stockId).toBe(stock.id);
      expect(result.details[0].previousValue).toBe(100);
      expect(result.details[0].growthFromContributions).toBe(5);
      expect(result.details[0].growthFromInterest).toBe(3);
      expect(result.details[0].newValue).toBe(108);
      expect(result.totalContributions).toBe(100);
      expect(result.totalInterest).toBe(500);
    });

    it('should calculate dividends from ledger entries', async () => {
      // ARRANGE
      const operationId = 'operation-1';
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const stockType = StockType.create({
        id: 'dividend',
        name: 'dividend',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });

      const dividendStock = Stock.create({
        name: 'dividend',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: dividendStock.id,
        quantity: 10,
      });

      const stockHistory = StockValueHistory.create({
        stockId: dividendStock.id,
        operationId,
        previousValue: 100,
        growthFromContributions: 0,
        growthFromInterest: 0,
        totalGrowthPerShare: 0,
        newValue: 100,
      });

      const dividendEntry = LedgerEntry.create({
        operationId,
        accountType: DIVIDENDS_PAYABLE_ACCOUNT,
        amount: -500, // Credit
        stockId: dividendStock.id,
      });

      stockValueHistoryRepository.findByOperation.mockResolvedValue([
        stockHistory,
      ]);
      stockRepository.findAll.mockResolvedValue([dividendStock]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([dividendEntry]);
      operationRepository.findByMeeting.mockResolvedValue([]);

      // ACT
      const result = await service.getExecutedRevaluationData(
        operationId,
        meetingId,
      );

      // ASSERT
      expect(result.details).toHaveLength(1);
      expect(result.details[0].dividendsGenerated).toBe(50); // 500 / 10 shares
    });

    it('should reconstruct details from StockValueHistory', async () => {
      // ARRANGE
      const operationId = 'operation-1';
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const stockTypeNotGuaranteed = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });
      const stockTypeGuaranteed = StockType.create({
        id: 'bono',
        name: 'bono',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: true,
        guaranteedYield: 0.05,
      });

      const stock1 = Stock.create({
        name: 'Acción A',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockTypeNotGuaranteed.id
      });

      const stock2 = Stock.create({
        name: 'Acción B',
        value: 200,
        monthlyContribution: 20,
        stockTypeId: stockTypeGuaranteed.id
      });

      const subscription1 = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock1.id,
        quantity: 10,
      });

      const subscription2 = StockSubscription.create({
        memberId: 'member-2',
        stockId: stock2.id,
        quantity: 5,
      });

      const history1 = StockValueHistory.create({
        stockId: stock1.id,
        operationId,
        previousValue: 100,
        growthFromContributions: 5,
        growthFromInterest: 3,
        totalGrowthPerShare: 8,
        newValue: 108,
      });

      const history2 = StockValueHistory.create({
        stockId: stock2.id,
        operationId,
        previousValue: 200,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 215,
      });

      stockValueHistoryRepository.findByOperation.mockResolvedValue([
        history1,
        history2,
      ]);
      stockRepository.findAll.mockResolvedValue([stock1, stock2]);
      stockSubscriptionRepository.findByStock
        .mockResolvedValueOnce([subscription1])
        .mockResolvedValueOnce([subscription2]);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([]);
      operationRepository.findByMeeting.mockResolvedValue([]);

      // ACT
      const result = await service.getExecutedRevaluationData(
        operationId,
        meetingId,
      );

      // ASSERT
      expect(result.details).toHaveLength(2);
      expect(result.details[0].stockId).toBe(stock1.id);
      expect(result.details[0].previousValue).toBe(100);
      expect(result.details[0].newValue).toBe(108);
      expect(result.details[1].stockId).toBe(stock2.id);
      expect(result.details[1].previousValue).toBe(200);
      expect(result.details[1].newValue).toBe(215);
    });

    it('should calculate totals from ledger entries', async () => {
      // ARRANGE
      const operationId = 'operation-1';
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';

      const stockType = StockType.create({
        id: 'regular',
        name: 'regular',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
      });

      const stock = Stock.create({
        name: 'regular',
        value: 100,
        monthlyContribution: 10,
        stockTypeId: stockType.id,
      });

      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: stock.id,
        quantity: 10,
      });

      const stockHistory = StockValueHistory.create({
        stockId: stock.id,
        operationId,
        previousValue: 100,
        growthFromContributions: 5,
        growthFromInterest: 3,
        totalGrowthPerShare: 8,
        newValue: 108,
      });

      const meetingDate = new Date('2024-01-15');
      const monthlyPaymentOperation = Operation.create({
        meetingId,
        type: 'MONTHLY_PAYMENT' as OperationType,
        date: meetingDate,
      });

      const contributionEntry1 = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -100,
        stockId: stock.id,
      });

      const contributionEntry2 = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -200,
        stockId: stock.id,
      });

      const interestEntry1 = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -300,
      });

      const interestEntry2 = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -200,
      });

      const mandatoryEntry = LedgerEntry.create({
        operationId: monthlyPaymentOperation.id,
        accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
        amount: -500,
        mandatoryContributionId: 'mandatory-1',
      });

      stockValueHistoryRepository.findByOperation.mockResolvedValue([
        stockHistory,
      ]);
      stockRepository.findAll.mockResolvedValue([stock]);
      stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        contributionEntry1,
        contributionEntry2,
        interestEntry1,
        interestEntry2,
        mandatoryEntry,
      ]);
      operationRepository.findByMeeting.mockResolvedValue([
        monthlyPaymentOperation,
      ]);

      // ACT
      const result = await service.getExecutedRevaluationData(
        operationId,
        meetingId,
      );

      // ASSERT
      expect(result.totalContributions).toBe(300); // 100 + 200
      expect(result.totalInterest).toBe(500); // 300 + 200
      expect(result.totalMandatoryContributions).toBe(500);
      expect(result.totalToDistribute).toBe(800); // 300 + 500
    });
  });
});
