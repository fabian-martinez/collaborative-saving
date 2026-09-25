import { Module } from '@nestjs/common';
import { DashboardV2Controller } from '../controllers/dashboard.v2.controller';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { GetPortfolioStatusQueryHandler } from '@application/queries/dashboard/get-portfolio-status.query-handler';
import { GetRecentActivityQueryHandler } from '@application/queries/dashboard/get-recent-activity.query-handler';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { MeetingsV2Module } from './meetings-v2.module';
import { AccountingV2Module } from './accounting-v2.module';
import { StocksV2Module } from './stocks-v2.module';
import { LoansV2Module } from './loans-v2.module';
import { PendingPaymentsV2Module } from './pending-payments-v2.module';
import { MembersV2Module } from './members-v2.module';
import {
  MEETING_REPOSITORY,
  LOAN_REPOSITORY,
  PENDING_MEMBER_PAYMENT_REPOSITORY,
  OPERATION_REPOSITORY,
  MEMBER_REPOSITORY,
  LEDGER_ENTRY_REPOSITORY,
} from '@domain/constants/injection-tokens';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';

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
      provide: GetRecentActivityQueryHandler,
      useFactory: (
        operationRepo: OperationRepository,
        memberRepo: MemberRepository,
        ledgerEntryRepo: LedgerEntryRepository,
      ) =>
        new GetRecentActivityQueryHandler(
          operationRepo,
          memberRepo,
          ledgerEntryRepo,
        ),
      inject: [
        OPERATION_REPOSITORY,
        MEMBER_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
      ],
    },
  ],
})
export class DashboardV2Module {}
