import { Module } from '@nestjs/common';
import { DashboardV2Controller } from '../controllers/dashboard.v2.controller';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { MeetingsV2Module } from './meetings-v2.module';
import { AccountingV2Module } from './accounting-v2.module';
import { StocksV2Module } from './stocks-v2.module';
import { LoansV2Module } from './loans-v2.module';
import { PendingPaymentsV2Module } from './pending-payments-v2.module';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    MeetingsV2Module,
    AccountingV2Module,
    StocksV2Module,
    LoansV2Module,
    PendingPaymentsV2Module,
  ],
  controllers: [DashboardV2Controller],
  providers: [
    {
      provide: MeetingSummaryService,
      useFactory: (
        dataSource: DataSource,
        operationRepo: OperationRepository,
        stockValueHistoryRepo: StockValueHistoryRepository,
        loanRepo: LoanRepository,
        pendingMemberPaymentRepo: PendingMemberPaymentRepository,
        stockRepo: StockRepository,
      ) =>
        new MeetingSummaryService(
          dataSource,
          operationRepo,
          stockValueHistoryRepo,
          loanRepo,
          pendingMemberPaymentRepo,
          stockRepo,
        ),
      inject: [
        DataSource,
        Symbol.for('OperationRepository'),
        Symbol.for('StockValueHistoryRepository'),
        Symbol.for('LoanRepository'),
        Symbol.for('PendingMemberPaymentRepository'),
        Symbol.for('StockRepository'),
      ],
    },
    {
      provide: GetMonthlyMovementsQueryHandler,
      useFactory: (meetingRepo: MeetingRepository, summaryService: MeetingSummaryService) =>
        new GetMonthlyMovementsQueryHandler(meetingRepo, summaryService),
      inject: [Symbol.for('MeetingRepository'), MeetingSummaryService],
    },
  ],
})
export class DashboardV2Module {}
