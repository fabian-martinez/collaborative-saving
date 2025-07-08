import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsModule } from './meetings/meetings.module';
import { MembersModule } from './members/members.module';
import { StocksModule } from './stocks/stocks.module';
import { StockSubscriptionsModule } from './stock-subscriptions/stock-subscriptions.module';
import { LoansModule } from './loans/loans.module';
import { LoanTransactionsModule } from './loan-transactions/loan-transactions.module';
import { OperationsModule } from './operations/operations.module';
import { LedgerEntriesModule } from './ledger-entries/ledger-entries.module';
import { MandatoryContributionsModule } from './mandatory-contributions/mandatory-contributions.module';
import { AssetRevaluationModule } from './asset-revaluation/asset-revaluation.module';
import { DuesModule } from './dues/dues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, // Recommended to be false in production
    }),
    MeetingsModule,
    MembersModule,
    StocksModule,
    StockSubscriptionsModule,
    LoansModule,
    LoanTransactionsModule,
    OperationsModule,
    LedgerEntriesModule,
    MandatoryContributionsModule,
    AssetRevaluationModule,
    DuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
