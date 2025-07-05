import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MandatoryContribution } from './entities/mandatory-contribution.entity';
import { MeetingsController } from './meetings.controller';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { OperationsModule } from '../operations/operations.module';
import { LedgerEntriesModule } from '../ledger-entries/ledger-entries.module';
import { Meeting } from './entities/meeting.entity';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MandatoryContribution, Meeting]),
    StockSubscriptionsModule,
    OperationsModule,
    LedgerEntriesModule,
    LoansModule,
  ],
  providers: [MeetingsService],
  controllers: [MeetingsController],
})
export class MeetingsModule {}
