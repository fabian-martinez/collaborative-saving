import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entities/operation.entity';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { LedgerEntriesModule } from '../ledger-entries/ledger-entries.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operation]),
    forwardRef(() => MeetingsModule),
    StockSubscriptionsModule,
    LedgerEntriesModule,
    forwardRef(() => LoansModule),
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
