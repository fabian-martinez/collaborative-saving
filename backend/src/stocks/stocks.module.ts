import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { Stock } from './entities/stock.entity';
import { StockValueHistory } from './entities/stock-value-history.entity';
import { OperationsModule } from '../operations/operations.module';
import { LoansModule } from '../loans/loans.module';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { MembersModule } from '../members/members.module';
import { Operation } from '../operations/entities/operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, StockValueHistory, StockSubscription, Operation]),
    forwardRef(() => OperationsModule),
    forwardRef(() => LoansModule),
    StockSubscriptionsModule,
    MembersModule,
  ],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
