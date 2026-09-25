import { GetDashboardMetricsQueryHandler } from './get-dashboard-metrics.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import {
  MeetingSummaryService,
  MeetingSummary,
} from '@application/services/meeting-summary.service';
import { LoanStatus } from '@domain/enums/loan-status.enum';
import { Member } from '@domain/entities/member.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Stock } from '@domain/entities/stock.entity';
import { Loan } from '@domain/entities/loan.entity';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';
import { Meeting } from '@domain/entities/meeting.entity';

describe('GetDashboardMetricsQueryHandler', () => {
  let handler: GetDashboardMetricsQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let meetingSummaryService: jest.Mocked<MeetingSummaryService>;

  beforeEach(() => {
    memberRepository = {
      findActive: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    stockSubscriptionRepository = {
      findByStocks: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    stockRepository = {
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    loanRepository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    pendingMemberPaymentRepository = {
      findWithFilters: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    meetingRepository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    meetingSummaryService = {
      calculateSummary: jest.fn(),
    } as unknown as jest.Mocked<MeetingSummaryService>;

    handler = new GetDashboardMetricsQueryHandler(
      memberRepository,
      stockSubscriptionRepository,
      stockRepository,
      loanRepository,
      pendingMemberPaymentRepository,
      meetingRepository,
      meetingSummaryService,
    );
  });

  it('should calculate metrics correctly', async () => {
    // Members mock
    memberRepository.findActive.mockResolvedValue([
      { id: '1', status: 'active' } as Member,
      { id: '2', status: 'active' } as Member,
      { id: '3', status: 'inactive' } as Member,
    ]);

    // Stock subscriptions mock
    stockSubscriptionRepository.findByStocks.mockResolvedValue([
      {
        status: 'active',
        quantity: 10,
        stockId: 'stock-1',
      } as StockSubscription,
      {
        status: 'active',
        quantity: 5,
        stockId: 'stock-2',
      } as StockSubscription,
      {
        status: 'cancelled',
        quantity: 2,
        stockId: 'stock-1',
      } as StockSubscription,
    ]);

    // Stocks mock
    stockRepository.findByIds.mockResolvedValue([
      { id: 'stock-1', value: 100 } as Stock,
      { id: 'stock-2', value: 200 } as Stock,
    ]);

    // Loans mock
    loanRepository.findAll.mockResolvedValue([
      {
        id: 'loan-1',
        status: LoanStatus.ACTIVE,
        outstandingBalance: 5000,
      } as Loan,
      {
        id: 'loan-2',
        status: LoanStatus.ACTIVE,
        outstandingBalance: 5000,
      } as Loan,
      { id: 'loan-3', status: LoanStatus.PAID, outstandingBalance: 0 } as Loan,
    ]);

    // Pending payments mock (loan-2 is overdue)
    pendingMemberPaymentRepository.findWithFilters.mockResolvedValue([
      {
        loanId: 'loan-2',
        status: 'pending',
        type: 'LOAN_PAYMENT',
      } as unknown as PendingMemberPayment,
    ]);

    // Meetings mock
    meetingRepository.findAll.mockResolvedValue([
      { id: 'm1', status: 'closed', date: new Date('2026-01-01') } as Meeting,
      { id: 'm2', status: 'closed', date: new Date('2026-02-01') } as Meeting,
    ]);

    const mockSummary = {
      meeting: { id: 'm2' },
      collections: { totalCollected: 15000 },
      disbursements: { totalDisbursed: 0 },
      netBalance: 15000,
      totalCollected: 15000,
      totalDisbursed: 0,
      metrics: {
        attendance: { current: 3, expected: 3, percentage: 100 },
        revaluation: null,
        paymentsUpToDate: 2,
        overduePayments: 0,
      },
    };

    const calculateSummarySpy = jest.spyOn(
      meetingSummaryService,
      'calculateSummary',
    );
    calculateSummarySpy.mockResolvedValue(
      mockSummary as unknown as MeetingSummary,
    );

    const result = await handler.execute();

    expect(result).toEqual({
      activeMembers: {
        count: 2,
        total: 3,
        changePercent: 0,
      },
      totalStocks: {
        count: 15,
        value: 2000,
        changePercent: 0,
      },
      activeLoans: {
        count: 2,
        inPortfolio: true,
      },
      totalPortfolio: {
        value: 10000,
      },
      overduePortfolio: {
        value: 5000,
        percentOfTotal: 50,
      },
      monthlyCollected: {
        value: 15000,
        changePercent: 0,
      },
    });

    expect(calculateSummarySpy).toHaveBeenCalledWith('m2');
  });
});
