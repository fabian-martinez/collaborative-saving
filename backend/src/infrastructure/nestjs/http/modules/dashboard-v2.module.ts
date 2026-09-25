import { Module } from '@nestjs/common';
import { DashboardV2Controller } from '../controllers/dashboard.v2.controller';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { GetPortfolioStatusQueryHandler } from '@application/queries/dashboard/get-portfolio-status.query-handler';
import { GetDashboardMetricsQueryHandler } from '@application/queries/dashboard/get-dashboard-metrics.query-handler';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { MeetingsV2Module } from './meetings-v2.module';
import { AccountingV2Module } from './accounting-v2.module';
import { StocksV2Module } from './stocks-v2.module';
import { LoansV2Module } from './loans-v2.module';
import { PendingPaymentsV2Module } from './pending-payments-v2.module';
import { MembersV2Module } from './members-v2.module';
import {
  MEMBER_REPOSITORY,
  STOCK_SUBSCRIPTION_REPOSITORY,
  STOCK_REPOSITORY,
  LOAN_REPOSITORY,
  PENDING_MEMBER_PAYMENT_REPOSITORY,
  MEETING_REPOSITORY,
} from '@domain/constants/injection-tokens';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';

@Module({
  imports: [
    MeetingsV2Module,
    AccountingV2Module,
    StocksV2Module,
    LoansV2Module,
    PendingPaymentsV2Module,
    MembersV2Module,
  ],
  controllers: [DashboardV2Controller],
  providers: [
    {
      provide: GetMonthlyMovementsQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        summaryService: MeetingSummaryService,
      ) => new GetMonthlyMovementsQueryHandler(meetingRepo, summaryService),
      inject: [MEETING_REPOSITORY, MeetingSummaryService],
    },
    {
      provide: GetPortfolioStatusQueryHandler,
      useFactory: (
        loanRepo: LoanRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
      ) => new GetPortfolioStatusQueryHandler(loanRepo, pendingPaymentRepo),
      inject: [LOAN_REPOSITORY, PENDING_MEMBER_PAYMENT_REPOSITORY],
    },
    {
      provide: GetDashboardMetricsQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        stockSubRepo: StockSubscriptionRepository,
        stockRepo: StockRepository,
        loanRepo: LoanRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
        meetingRepo: MeetingRepository,
        summaryService: MeetingSummaryService,
      ) =>
        new GetDashboardMetricsQueryHandler(
          memberRepo,
          stockSubRepo,
          stockRepo,
          loanRepo,
          pendingPaymentRepo,
          meetingRepo,
          summaryService,
        ),
      inject: [
        MEMBER_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        STOCK_REPOSITORY,
        LOAN_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        MEETING_REPOSITORY,
        MeetingSummaryService,
      ],
    },
  ],
})
export class DashboardV2Module {}
