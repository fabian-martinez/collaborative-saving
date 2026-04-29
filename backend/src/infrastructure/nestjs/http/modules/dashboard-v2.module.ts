import { Module } from '@nestjs/common';
import { DashboardV2Controller } from '../controllers/dashboard.v2.controller';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { MeetingsV2Module } from './meetings-v2.module';
import { AccountingV2Module } from './accounting-v2.module';
import { StocksV2Module } from './stocks-v2.module';
import { LoansV2Module } from './loans-v2.module';
import { PendingPaymentsV2Module } from './pending-payments-v2.module';
import { MEETING_REPOSITORY } from '@domain/constants/injection-tokens';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';

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
      provide: GetMonthlyMovementsQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        summaryService: MeetingSummaryService,
      ) => new GetMonthlyMovementsQueryHandler(meetingRepo, summaryService),
      inject: [MEETING_REPOSITORY, MeetingSummaryService],
    },
  ],
})
export class DashboardV2Module {}
