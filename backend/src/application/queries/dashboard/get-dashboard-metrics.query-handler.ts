import { Inject, Injectable } from '@nestjs/common';
import { GetDashboardMetricsResponseDto } from '@application/dto/dashboard/dashboard-metrics-response.dto';
import {
  MEMBER_REPOSITORY,
  STOCK_SUBSCRIPTION_REPOSITORY,
  LOAN_REPOSITORY,
  PENDING_MEMBER_PAYMENT_REPOSITORY,
  MEETING_REPOSITORY,
} from '@domain/constants/injection-tokens';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { LoanStatus } from '@domain/enums/loan-status.enum';

@Injectable()
export class GetDashboardMetricsQueryHandler {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(STOCK_SUBSCRIPTION_REPOSITORY)
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepository: LoanRepository,
    @Inject(PENDING_MEMBER_PAYMENT_REPOSITORY)
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingSummaryService: MeetingSummaryService,
  ) {}

  async execute(): Promise<GetDashboardMetricsResponseDto> {
    const allMembers = await this.memberRepository.findAll();
    const totalMembersCount = allMembers.length;
    const activeMembersCount = allMembers.filter(
      (m) => m.status === 'active',
    ).length;

    const subscriptions = await this.stockSubscriptionRepository.findAll();
    const activeSubscriptions = subscriptions.filter(
      (s) => s.status === 'active',
    );
    const stocksCount = activeSubscriptions.reduce(
      (acc, s) => acc + (s.sharesCount || s.shares_count || 1),
      0,
    );
    const stocksValue = activeSubscriptions.reduce(
      (acc, s) =>
        acc +
        (s.totalValue || s.total_value || (s.sharesCount || 1) * (s.sharePrice || 0)),
      0,
    );

    const loans = await this.loanRepository.findAll();
    const activeLoans = loans.filter(
      (l) => (l.status as LoanStatus) === LoanStatus.ACTIVE,
    );
    const activeLoansCount = activeLoans.length;

    const totalPortfolioValue = activeLoans.reduce(
      (acc, l) => acc + (l.balance || l.amount || 0),
      0,
    );

    const pendingPayments =
      await this.pendingMemberPaymentRepository.findWithFilters({
        status: 'pending',
        type: 'LOAN_PAYMENT',
      });
    const overdueLoanIds = new Set(
      pendingPayments.map((p) => p.loanId).filter(Boolean),
    );

    const overdueLoans = activeLoans.filter((l) => overdueLoanIds.has(l.id));
    const overduePortfolioValue = overdueLoans.reduce(
      (acc, l) => acc + (l.balance || l.amount || 0),
      0,
    );

    const overduePercentOfTotal =
      totalPortfolioValue > 0
        ? Number(((overduePortfolioValue / totalPortfolioValue) * 100).toFixed(1))
        : 0;

    const meetings = await this.meetingRepository.findAll();
    const closedMeetings = meetings
      .filter((m) => m.status === 'closed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let monthlyCollectedValue = 0;
    if (closedMeetings.length > 0) {
      const lastClosedMeeting = closedMeetings[0];
      const summary = await this.meetingSummaryService.calculateSummary(
        lastClosedMeeting.id,
      );
      monthlyCollectedValue = summary.totalCollected || 0;
    }

    return {
      activeMembers: {
        count: activeMembersCount,
        total: totalMembersCount,
        changePercent: 0,
      },
      totalStocks: {
        count: stocksCount,
        value: stocksValue,
        changePercent: 0,
      },
      activeLoans: {
        count: activeLoansCount,
        inPortfolio: activeLoansCount > 0,
      },
      totalPortfolio: {
        value: totalPortfolioValue,
      },
      overduePortfolio: {
        value: overduePortfolioValue,
        percentOfTotal: overduePercentOfTotal,
      },
      monthlyCollected: {
        value: monthlyCollectedValue,
        changePercent: 0,
      },
    };
  }
}
