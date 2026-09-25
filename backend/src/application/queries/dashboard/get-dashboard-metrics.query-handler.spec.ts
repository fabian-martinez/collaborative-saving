import { GetDashboardMetricsQueryHandler } from './get-dashboard-metrics.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { LoanStatus } from '@domain/enums/loan-status.enum';

describe('GetDashboardMetricsQueryHandler', () => {
  let handler: GetDashboardMetricsQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let meetingSummaryService: jest.Mocked<MeetingSummaryService>;

  beforeEach(() => {
    memberRepository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    stockSubscriptionRepository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

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
      loanRepository,
      pendingMemberPaymentRepository,
      meetingRepository,
      meetingSummaryService,
    );
  });

  it('should calculate metrics correctly', async () => {
    // Members mock
    memberRepository.findAll.mockResolvedValue([
      { id: '1', status: 'active' } as any,
      { id: '2', status: 'active' } as any,
      { id: '3', status: 'inactive' } as any,
    ]);

    // Stock subscriptions mock
    stockSubscriptionRepository.findAll.mockResolvedValue([
      { status: 'active', sharesCount: 10, sharePrice: 100, totalValue: 1000 } as any,
      { status: 'active', sharesCount: 5, sharePrice: 200, totalValue: 1000 } as any,
      { status: 'cancelled', sharesCount: 2, sharePrice: 100, totalValue: 200 } as any,
    ]);

    // Loans mock
    loanRepository.findAll.mockResolvedValue([
      { id: 'loan-1', status: LoanStatus.ACTIVE, balance: 5000 } as any,
      { id: 'loan-2', status: LoanStatus.ACTIVE, balance: 5000 } as any,
      { id: 'loan-3', status: LoanStatus.PAID, balance: 0 } as any,
    ]);

    // Pending payments mock (loan-2 is overdue)
    pendingMemberPaymentRepository.findWithFilters.mockResolvedValue([
      { loanId: 'loan-2', status: 'pending', type: 'LOAN_PAYMENT' } as any,
    ]);

    // Meetings mock
    meetingRepository.findAll.mockResolvedValue([
      { id: 'm1', status: 'closed', date: new Date('2026-01-01') } as any,
      { id: 'm2', status: 'closed', date: new Date('2026-02-01') } as any,
    ]);

    meetingSummaryService.calculateSummary.mockResolvedValue({
      totalCollected: 15000,
    } as any);

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

    expect(meetingSummaryService.calculateSummary).toHaveBeenCalledWith('m2');
  });
});
