import { DataSource } from 'typeorm';
import { MeetingSummaryService } from './meeting-summary.service';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { OperationType } from '@domain/enums/operation-type.enum';

describe('MeetingSummaryService', () => {
  let service: MeetingSummaryService;

  const mockDataSource = {
    getRepository: jest.fn(),
  };

  const mockLedgerRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockOperationRepo = {
    find: jest.fn(),
  };

  const mockOperationRepository = {
    findByMeetingAndType: jest.fn(),
  } as unknown as jest.Mocked<OperationRepository>;

  const mockStockValueHistoryRepository = {
    findByOperation: jest.fn(),
  } as unknown as jest.Mocked<StockValueHistoryRepository>;

  const mockLoanRepository = {
    findAll: jest.fn(),
  } as unknown as jest.Mocked<LoanRepository>;

  const mockPendingMemberPaymentRepository = {
    findByMeeting: jest.fn(),
  } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

  const mockStockRepository = {
    findActive: jest.fn(),
  } as unknown as jest.Mocked<StockRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSource.getRepository.mockImplementation((entity) => {
      if (entity === LedgerEntry) {
        return mockLedgerRepo;
      }
      if (entity === Operation) {
        return mockOperationRepo;
      }
      return null;
    });

    // Reset all repository mocks
    mockOperationRepository.findByMeetingAndType.mockResolvedValue([]);
    mockStockValueHistoryRepository.findByOperation.mockResolvedValue([]);
    mockLoanRepository.findAll.mockResolvedValue([]);
    mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue([]);
    mockStockRepository.findActive.mockResolvedValue([]);

    // Create service instance directly with all dependencies
    service = new MeetingSummaryService(
      mockDataSource as unknown as DataSource,
      mockOperationRepository,
      mockStockValueHistoryRepository,
      mockLoanRepository,
      mockPendingMemberPaymentRepository,
      mockStockRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSummary', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return empty summary when no operations exist', async () => {
      // ARRANGE
      mockOperationRepo.find.mockResolvedValue([]);

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result).toEqual({
        totalCash: 0,
        totalInterest: 0,
        totalLoans: 0,
        totalCollected: 0,
        totalDividends: 0,
        totalStockInvestment: 0,
        finalCashBalance: 0,
        totalDisbursed: 0,
        participantsCount: 0,
        duration: '0h 0m',
      });
    });

    it('should calculate all summary fields correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          date: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          date: new Date('2024-01-15T12:30:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      // Mock query builder for ledger entries
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock sumByAccountType calls
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '150000.00' }) // totalCash
        .mockResolvedValueOnce({ sum: '5000.00' }) // totalInterest
        .mockResolvedValueOnce({ sum: '20000.00' }) // totalLoans
        .mockResolvedValueOnce({ sum: '150000.00' }) // cashIn (positive only)
        .mockResolvedValueOnce({ sum: '5000.00' }) // noveltyLoss
        .mockResolvedValueOnce({ sum: '10000.00' }) // totalDividends
        .mockResolvedValueOnce({ sum: '30000.00' }) // totalStockInvestment
        .mockResolvedValueOnce({ sum: '150000.00' }) // totalDebits
        .mockResolvedValueOnce({ sum: '-30000.00' }); // credits (negative)

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result.totalCash).toBe(150000.0);
      expect(result.totalInterest).toBe(5000.0);
      expect(result.totalLoans).toBe(20000.0);
      expect(result.totalCollected).toBe(145000.0); // 150000 - 5000
      expect(result.totalDividends).toBe(10000.0);
      expect(result.totalStockInvestment).toBe(30000.0);
      expect(result.finalCashBalance).toBe(120000.0); // 150000 - 30000
      expect(result.totalDisbursed).toBe(30000.0);
      expect(result.participantsCount).toBe(2);
      expect(result.duration).toBe('2h 30m');
    });

    it('should calculate duration correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          date: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          date: new Date('2024-01-15T11:45:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '0' }),
      };

      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result.duration).toBe('1h 45m');
    });

    it('should handle null sums correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: null }),
      };

      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result.totalCash).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalCollected).toBe(0);
    });

    it('should convert negative interest to positive (interests are recorded as negative credits)', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValueOnce({ sum: '0' }) // totalCash
          .mockResolvedValueOnce({ sum: '-13564463.00' }) // totalInterest (negative as stored in DB)
          .mockResolvedValueOnce({ sum: '0' }) // totalLoans
          .mockResolvedValueOnce({ sum: '0' }) // cashIn
          .mockResolvedValueOnce({ sum: '0' }) // noveltyLoss
          .mockResolvedValueOnce({ sum: '0' }) // totalDividends
          .mockResolvedValueOnce({ sum: '0' }) // totalStockInvestment
          .mockResolvedValueOnce({ sum: '0' }) // totalDebits
          .mockResolvedValueOnce({ sum: '0' }), // credits
      };

      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      // Interest should be positive even though stored as negative in DB
      expect(result.totalInterest).toBe(13564463.0);
    });
  });

  describe('calculateDetailedSummary', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return empty summary when no operations exist', async () => {
      // ARRANGE
      mockOperationRepo.find.mockResolvedValue([]);

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result).toEqual({
        summary: {
          totalCollected: 0,
          totalDisbursed: 0,
          shareValue: 0,
          participants: 0,
        },
        collections: {
          memberContributions: { count: 0, amount: 0 },
          loanPayments: { count: 0, amount: 0 },
          interestCollected: 0,
          feesCollected: 0,
        },
        disbursements: {
          newLoans: { count: 0, amount: 0 },
          stockLiquidations: { count: 0, amount: 0 },
          dividendPayments: { count: 0, amount: 0 },
        },
        metrics: {
          attendance: {
            current: 0,
            percentage: 100,
          },
          revaluation: null,
          paymentsUpToDate: 0,
          overduePayments: 0,
        },
      });
    });

    it('should calculate detailed summary with revaluation correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          type: OperationType.LOAN_PAYMENT,
          date: new Date('2024-01-15T11:00:00Z'),
        },
        {
          id: 'op-3',
          memberId: 'member-3',
          type: OperationType.LOAN_DISBURSEMENT,
          date: new Date('2024-01-15T12:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      // Mock revaluation operations
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const revaluationOp = {
        id: 'reval-op-1',
        memberId: null,
        type: OperationType.ASSET_REVALUATION,
        date: new Date('2024-01-15T13:00:00Z'),
      } as any;
      mockOperationRepository.findByMeetingAndType.mockResolvedValue([
        revaluationOp,
      ]);

      // Mock stock value histories
      const histories = [
        { previousValue: 1000, newValue: 1100 },
        { previousValue: 1000, newValue: 1100 },
      ] as any[]; // Using any[] to bypass strict typing for now, but safer than just as any

      mockStockValueHistoryRepository.findByOperation.mockResolvedValue(
        histories,
      );

      // Mock loans
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockLoanRepository.findAll.mockResolvedValue([
        { id: 'loan-1', status: 'active' },
        { id: 'loan-2', status: 'active' },
        { id: 'loan-3', status: 'paid' },
      ] as any);

      // Mock pending payments
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue([
        {
          id: 'pending-1',
          meetingId,
          status: 'pending',
        },
        {
          id: 'pending-2',
          meetingId,
          status: 'approved',
        },
      ] as any);

      // Mock query builder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock sumByAccountType calls
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '150000.00' }) // totalCollected (CASH_ACCOUNT, positiveOnly)
        .mockResolvedValueOnce({ sum: '50000.00' }) // totalDisbursed (SUM(ABS(amount)) already positive)
        .mockResolvedValueOnce({ sum: '5000.00' }) // memberContributions (MONTHLY_PAYMENT)
        .mockResolvedValueOnce({ sum: '10000.00' }) // loanPayments (LOAN_PAYMENT)
        .mockResolvedValueOnce({ sum: '-2000.00' }) // interestCollected (INTEREST_INCOME_ACCOUNT)
        .mockResolvedValueOnce({ sum: '-500.00' }) // feesCollected (FEE_INCOME_ACCOUNT)
        .mockResolvedValueOnce({ sum: '-30000.00' }) // newLoans (LOAN_DISBURSEMENT, negative)
        .mockResolvedValueOnce({ sum: null }) // stockLiquidations (STOCK_WITHDRAWAL, empty)
        .mockResolvedValueOnce({ sum: null }); // dividendPayments (DIVIDEND_PAYMENT, empty)

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result.summary.totalCollected).toBe(150000.0);
      expect(result.summary.totalDisbursed).toBe(50000.0);
      expect(result.summary.shareValue).toBe(1100.0); // Average of histories
      expect(result.summary.participants).toBe(3);

      expect(result.collections.memberContributions).toEqual({
        count: 1,
        amount: 5000.0,
      });
      expect(result.collections.loanPayments).toEqual({
        count: 1,
        amount: 10000.0,
      });
      expect(result.collections.interestCollected).toBe(2000.0);
      expect(result.collections.feesCollected).toBe(500.0);

      expect(result.disbursements.newLoans).toEqual({
        count: 1,
        amount: 30000.0,
      });
      expect(result.disbursements.stockLiquidations).toEqual({
        count: 0,
        amount: 0,
      });
      expect(result.disbursements.dividendPayments).toEqual({
        count: 0,
        amount: 0,
      });

      expect(result.metrics.attendance.current).toBe(3);
      expect(result.metrics.attendance.percentage).toBe(100);
      expect(result.metrics.revaluation).toEqual({
        previousValue: 1000.0,
        newValue: 1100.0,
        percentage: 10.0, // (1100 - 1000) / 1000 * 100
      });
      expect(result.metrics.paymentsUpToDate).toBe(2);
      expect(result.metrics.overduePayments).toBe(2);
    });

    it('should calculate detailed summary without revaluation using current stock values', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);
      mockOperationRepository.findByMeetingAndType.mockResolvedValue([]); // No revaluation

      // Mock current stocks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockStockRepository.findActive.mockResolvedValue([
        { id: 'stock-1', value: 1200 },
        { id: 'stock-2', value: 1300 },
        { id: 'stock-3', value: 1100 },
      ] as any);

      mockLoanRepository.findAll.mockResolvedValue([]);
      mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue([]);

      // Mock query builder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '50000.00' }) // totalCollected
        .mockResolvedValueOnce({ sum: null }) // totalDisbursed
        .mockResolvedValueOnce({ sum: '50000.00' }) // memberContributions
        .mockResolvedValueOnce({ sum: null }) // loanPayments
        .mockResolvedValueOnce({ sum: null }) // interestCollected
        .mockResolvedValueOnce({ sum: null }) // feesCollected
        .mockResolvedValueOnce({ sum: null }) // newLoans
        .mockResolvedValueOnce({ sum: null }) // stockLiquidations
        .mockResolvedValueOnce({ sum: null }); // dividendPayments

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result.summary.shareValue).toBe(1200.0); // Average of stocks: (1200 + 1300 + 1100) / 3
      expect(result.metrics.revaluation).toBeNull();
    });

    it('should handle revaluation without histories (shareValue should be 0 or use stocks)', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      // Mock revaluation operation but no histories
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const revaluationOp = {
        id: 'reval-op-1',
        memberId: null,
        type: OperationType.ASSET_REVALUATION,
        date: new Date('2024-01-15T13:00:00Z'),
      } as any;
      mockOperationRepository.findByMeetingAndType.mockResolvedValue([
        revaluationOp,
      ]);
      mockStockValueHistoryRepository.findByOperation.mockResolvedValue([]); // No histories
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockStockRepository.findActive.mockResolvedValue([
        { id: 'stock-1', value: 1500 },
      ] as any);

      mockLoanRepository.findAll.mockResolvedValue([]);
      mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue([]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null });

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result.summary.shareValue).toBe(1500.0); // Uses stock value since no histories
      expect(result.metrics.revaluation).toBeNull(); // No histories means no revaluation metric
    });

    it('should handle operations without ledger entries correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          type: OperationType.STOCK_WITHDRAWAL,
          date: new Date('2024-01-15T11:00:00Z'),
        },
        {
          id: 'op-3',
          memberId: 'member-3',
          type: OperationType.DIVIDEND_PAYMENT,
          date: new Date('2024-01-15T12:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);
      mockOperationRepository.findByMeetingAndType.mockResolvedValue([]);
      mockStockRepository.findActive.mockResolvedValue([]);
      mockLoanRepository.findAll.mockResolvedValue([]);
      mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue([]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // All queries return null (no ledger entries)
      mockQueryBuilder.getRawOne.mockResolvedValue({ sum: null });

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result.summary.totalCollected).toBe(0);
      expect(result.summary.totalDisbursed).toBe(0);
      expect(result.summary.shareValue).toBe(0);
      expect(result.summary.participants).toBe(3);

      // Operations exist but no ledger entries means counts are correct but amounts are 0
      expect(result.collections.memberContributions.count).toBe(1);
      expect(result.collections.memberContributions.amount).toBe(0);
      expect(result.disbursements.stockLiquidations.count).toBe(1);
      expect(result.disbursements.stockLiquidations.amount).toBe(0);
      expect(result.disbursements.dividendPayments.count).toBe(1);
      expect(result.disbursements.dividendPayments.amount).toBe(0);
    });

    it('should handle revaluation with avgPrevious = 0 (percentage should be 0)', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const revaluationOp = {
        id: 'reval-op-1',
        memberId: null,
        type: OperationType.ASSET_REVALUATION,
        date: new Date('2024-01-15T13:00:00Z'),
      } as any;
      mockOperationRepository.findByMeetingAndType.mockResolvedValue([
        revaluationOp,
      ]);

      // Histories with previousValue = 0
      const histories = [
        { previousValue: 0, newValue: 100 },
        { previousValue: 0, newValue: 200 },
      ] as any[];

      mockStockValueHistoryRepository.findByOperation.mockResolvedValue(
        histories,
      );

      mockLoanRepository.findAll.mockResolvedValue([]);
      mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue([]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null });

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result.metrics.revaluation).toEqual({
        previousValue: 0,
        newValue: 150.0, // (0 + 100 + 0 + 200) / 2 = 150
        percentage: 0, // avgPrevious is 0, so percentage is 0
      });
    });

    it('should handle multiple revaluation operations (use most recent)', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      // Multiple revaluation operations (most recent should be used)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const revaluationOp1 = {
        id: 'reval-op-1',
        memberId: null,
        type: OperationType.ASSET_REVALUATION,
        date: new Date('2024-01-15T13:00:00Z'),
      } as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const revaluationOp2 = {
        id: 'reval-op-2',
        memberId: null,
        type: OperationType.ASSET_REVALUATION,
        date: new Date('2024-01-15T14:00:00Z'), // More recent
      } as any;
      mockOperationRepository.findByMeetingAndType.mockResolvedValue([
        revaluationOp2,
        revaluationOp1,
      ]);

      // Histories for the most recent revaluation
      const histories = [{ previousValue: 1000, newValue: 1200 }] as any[];

      mockStockValueHistoryRepository.findByOperation.mockResolvedValue(
        histories,
      );

      mockLoanRepository.findAll.mockResolvedValue([]);
      mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue([]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null });

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result.summary.shareValue).toBe(1200.0);
      // Verify it was called with the most recent operation ID
      // Using mock.calls directly to avoid unbound-method error when accessing method
      const findByOperationMock =
        mockStockValueHistoryRepository.findByOperation.mock;
      expect(findByOperationMock.calls.length).toBeGreaterThan(0);
      expect(findByOperationMock.calls[0][0]).toBe('reval-op-2'); // Most recent operation ID
    });

    it('should filter pending payments correctly by status and meetingId', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);
      mockOperationRepository.findByMeetingAndType.mockResolvedValue([]);
      mockStockRepository.findActive.mockResolvedValue([]);
      mockLoanRepository.findAll.mockResolvedValue([]);

      // Mock pending payments with different statuses

      const pendingPayments = [
        {
          id: 'pending-1',
          meetingId,
          status: 'pending',
        },
        {
          id: 'pending-2',
          meetingId,
          status: 'approved',
        },
        {
          id: 'pending-3',
          meetingId,
          status: 'rejected', // Should be excluded
        },
        {
          id: 'pending-4',
          meetingId: 'other-meeting-id', // Different meeting, should be excluded
          status: 'pending',
        },
      ] as any[];

      mockPendingMemberPaymentRepository.findByMeeting.mockResolvedValue(
        pendingPayments,
      );

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: '50000.00' })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null })
        .mockResolvedValueOnce({ sum: null });

      // ACT
      const result = await service.calculateDetailedSummary(meetingId);

      // ASSERT
      expect(result.metrics.overduePayments).toBe(2); // Only pending and approved with correct meetingId
    });
  });
});
