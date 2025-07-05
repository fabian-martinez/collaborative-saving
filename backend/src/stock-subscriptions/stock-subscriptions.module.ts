import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockSubscription } from './entities/stock-subscription.entity';
import { StockSubscriptionsController } from './stock-subscriptions.controller';
import { StockSubscriptionsService } from './stock-subscriptions.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockSubscription])],
  controllers: [StockSubscriptionsController],
  providers: [StockSubscriptionsService],
  exports: [StockSubscriptionsService],
})
export class StockSubscriptionsModule {}
