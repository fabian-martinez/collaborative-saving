import { Module, forwardRef } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsController } from './meetings.controller';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { OperationsModule } from '../operations/operations.module';
import { LedgerEntriesModule } from '../ledger-entries/ledger-entries.module';
import { Meeting } from './entities/meeting.entity';
import { LoansModule } from '../loans/loans.module';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { MandatoryContributionStrategy } from './strategies/mandatory-contribution.strategy';
import { StockFeeStrategy } from './strategies/stock-fee.strategy';
import { LoanPaymentStrategy } from './strategies/loan-payment.strategy';
import { FeeStrategy } from './strategies/fee.strategy';
import { InsuranceStrategy } from './strategies/insurance.strategy';
import { DefaultPaymentStrategy } from './strategies/default-payment.strategy';
import { MandatoryContributionsModule } from '../mandatory-contributions/mandatory-contributions.module';
import { AssetRevaluationModule } from '../asset-revaluation/asset-revaluation.module';
import { DuesModule } from '../dues/dues.module';
import { MembersModule } from '../members/members.module';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting]),
    StockSubscriptionsModule,
    OperationsModule,
    LedgerEntriesModule,
    LoansModule,
    MandatoryContributionsModule,
    AssetRevaluationModule,
    forwardRef(() => DuesModule),
    MembersModule,
    StocksModule,
  ],
  providers: [
    MeetingsService,
    PaymentStrategyFactory,
    MandatoryContributionStrategy,
    StockFeeStrategy,
    LoanPaymentStrategy,
    FeeStrategy,
    InsuranceStrategy,
    DefaultPaymentStrategy,
  ],
  controllers: [MeetingsController],
  exports: [MeetingsService],
})
export class MeetingsModule {}
