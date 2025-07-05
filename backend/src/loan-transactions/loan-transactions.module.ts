import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanTransactionsService } from './loan-transactions.service';
import { LoanTransactionsController } from './loan-transactions.controller';
import { LoanTransactionDetail } from '../loans/entities/loan-transaction-detail.entity';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [TypeOrmModule.forFeature([LoanTransactionDetail]), LoansModule],
  controllers: [LoanTransactionsController],
  providers: [LoanTransactionsService],
})
export class LoanTransactionsModule {}
