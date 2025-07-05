import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { LoanTransactionDetail } from './entities/loan-transaction-detail.entity';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { OperationsModule } from '../operations/operations.module';
import { LedgerEntriesModule } from '../ledger-entries/ledger-entries.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, LoanTransactionDetail]),
    StockSubscriptionsModule,
    forwardRef(() => OperationsModule),
    LedgerEntriesModule,
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
