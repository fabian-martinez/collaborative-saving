import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entities/operation.entity';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { StocksModule } from '../stocks/stocks.module';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operation]),
    StocksModule,
    StockSubscriptionsModule,
    forwardRef(() => LoansModule),
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
