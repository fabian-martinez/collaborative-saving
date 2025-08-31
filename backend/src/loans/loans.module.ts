import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { LoanTransactionDetail } from './entities/loan-transaction-detail.entity';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { OperationsModule } from '../operations/operations.module';
import { LedgerEntriesModule } from '../ledger-entries/ledger-entries.module';
import { StocksModule } from '../stocks/stocks.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    forwardRef(() => MeetingsModule),
    TypeOrmModule.forFeature([Loan, LoanTransactionDetail]),
    StockSubscriptionsModule,
    forwardRef(() => OperationsModule),
    LedgerEntriesModule,
    forwardRef(() => StocksModule),
    MembersModule,
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
