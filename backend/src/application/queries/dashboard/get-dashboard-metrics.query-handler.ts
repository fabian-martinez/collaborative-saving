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
import { Member } from '@domain/entities/member.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Loan } from '@domain/entities/loan.entity';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';
import { Meeting } from '@domain/entities/meeting.entity';

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
    const allMembers: Member[] = await this.memberRepository.findActive();
    const totalMembersCount = allMembers.length;
    const activeMembersCount = allMembers.filter(
      (m: Member) => m.status === 'active',
    ).length;

    const subscriptions: StockSubscription[] =
      await this.stockSubscriptionRepository.findByStocks([]);
    const activeSubscriptions = subscriptions.filter(
      (s: StockSubscription) => s.status === 'active',
    );
    const stocksCount = activeSubscriptions.reduce(
      (acc: number, s: StockSubscription): number => acc + (s.sharesCount || 1),
      0,
    );
    const stocksValue = activeSubscriptions.reduce(
      (acc: number, s: StockSubscription): number =>
        acc + (s.totalValue || (s.sharesCount || 1) * (s.sharePrice || 0)),
      0,
    );

    const loans: Loan[] = await this.loanRepository.findAll();
    const activeLoans = loans.filter(
      (l: Loan) => (l.status as LoanStatus) === LoanStatus.ACTIVE,
    );
    const activeLoansCount = activeLoans.length;

    const totalPortfolioValue = activeLoans.reduce(
      (acc: number, l: Loan): number => acc + (l.balance || l.amount || 0),
      0,
    );

    const pendingPayments: PendingMemberPayment[] =
      await this.pendingMemberPaymentRepository.findWithFilters({
        status: 'pending',
        type: 'LOAN_PAYMENT',
      });
    const overdueLoanIds = new Set<string>(
      pendingPayments
        .map((p: PendingMemberPayment) => p.loanId)
        .filter((id): id is string => Boolean(id)),
    );

    const overdueLoans = activeLoans.filter((l: Loan) => overdueLoanIds.has(l.id));
    const overduePortfolioValue = overdueLoans.reduce(
      (acc: number, l: Loan): number => acc + (l.balance || l.amount || 0),
      0,
    );

    const overduePercentOfTotal =
      totalPortfolioValue > 0
        ? Number(((overduePortfolioValue / totalPortfolioValue) * 100).toFixed(1))
        : 0;

    const meetings: Meeting[] = await this.meetingRepository.findAll();
    const closedMeetings = meetings
      .filter((m: Meeting) => m.status === 'closed')
      .sort((a: Meeting, b: Meeting) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
