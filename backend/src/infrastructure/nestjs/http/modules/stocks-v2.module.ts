import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from '@infrastructure/typeorm/entities/stock.entity';
import { StocksV2Controller } from '../controllers/stocks.v2.controller';
import { CreateStockUseCase } from '@application/use-cases/stocks/create-stock.use-case';
import { UpdateStockUseCase } from '@application/use-cases/stocks/update-stock.use-case';
import { GetStocksQueryHandler } from '@application/queries/stocks/get-stocks.query-handler';
import { GetStockDetailQueryHandler } from '@application/queries/stocks/get-stock-detail.query-handler';
import { TypeOrmStockRepository } from '../../../typeorm/repositories/typeorm-stock.repository';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';

const STOCK_REPOSITORY = Symbol('StockRepository');

@Module({
  imports: [TypeOrmModule.forFeature([Stock])],
  controllers: [StocksV2Controller],
  providers: [
    // Repository implementation
    {
      provide: STOCK_REPOSITORY,
      useClass: TypeOrmStockRepository,
    },
    // Query handlers
    {
      provide: GetStocksQueryHandler,
      useFactory: (repo: StockRepository) => new GetStocksQueryHandler(repo),
      inject: [STOCK_REPOSITORY],
    },
    {
      provide: GetStockDetailQueryHandler,
      useFactory: (repo: StockRepository) =>
        new GetStockDetailQueryHandler(repo),
      inject: [STOCK_REPOSITORY],
    },
    // Use cases
    {
      provide: CreateStockUseCase,
      useFactory: (repo: StockRepository) => new CreateStockUseCase(repo),
      inject: [STOCK_REPOSITORY],
    },
    {
      provide: UpdateStockUseCase,
      useFactory: (repo: StockRepository) => new UpdateStockUseCase(repo),
      inject: [STOCK_REPOSITORY],
    },
    TypeOrmStockRepository,
  ],
  exports: [STOCK_REPOSITORY],
})
export class StocksV2Module {}
