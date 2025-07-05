import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { Stock } from './entities/stock.entity';
import { StockValueHistory } from './entities/stock-value-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, StockValueHistory])],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
