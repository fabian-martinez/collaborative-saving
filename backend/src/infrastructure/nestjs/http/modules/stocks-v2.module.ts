import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from '@infrastructure/typeorm/entities/stock.entity';
import { StockType } from '@infrastructure/typeorm/entities/stock-type.entity';
import { StocksV2Controller } from '../controllers/stocks.v2.controller';
import { CreateStockUseCase } from '@application/use-cases/stocks/create-stock.use-case';
import { UpdateStockUseCase } from '@application/use-cases/stocks/update-stock.use-case';
import { DeleteStockUseCase } from '@application/use-cases/stocks/delete-stock.use-case';
import { GetStocksQueryHandler } from '@application/queries/stocks/get-stocks.query-handler';
import { GetStockDetailQueryHandler } from '@application/queries/stocks/get-stock-detail.query-handler';
import { TypeOrmStockRepository } from '../../../typeorm/repositories/typeorm-stock.repository';
import { TypeOrmStockTypeRepository } from '../../../typeorm/repositories/typeorm-stock-type.repository';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

export const STOCK_REPOSITORY = Symbol('StockRepository');
export const STOCK_TYPE_REPOSITORY = Symbol('StockTypeRepository');

@Module({
  imports: [TypeOrmModule.forFeature([Stock, StockType])],
  controllers: [StocksV2Controller],
  providers: [
    // Repository implementations
    {
      provide: STOCK_REPOSITORY,
      useClass: TypeOrmStockRepository,
    },
    {
      provide: STOCK_TYPE_REPOSITORY,
      useClass: TypeOrmStockTypeRepository,
    },
    // Query handlers
    {
      provide: GetStocksQueryHandler,
      useFactory: (stockRepo: StockRepository, stockTypeRepo: StockTypeRepository) => 
        new GetStocksQueryHandler(stockRepo, stockTypeRepo),
      inject: [STOCK_REPOSITORY, STOCK_TYPE_REPOSITORY],
    },
    {
      provide: GetStockDetailQueryHandler,
      useFactory: (stockRepo: StockRepository, stockTypeRepo: StockTypeRepository) =>
        new GetStockDetailQueryHandler(stockRepo, stockTypeRepo),
      inject: [STOCK_REPOSITORY, STOCK_TYPE_REPOSITORY],
    },
    // Use cases
    {
      provide: CreateStockUseCase,
      useFactory: (stockRepo: StockRepository, stockTypeRepo: StockTypeRepository) => 
        new CreateStockUseCase(stockRepo, stockTypeRepo),
      inject: [STOCK_REPOSITORY, STOCK_TYPE_REPOSITORY],
    },
    {
      provide: UpdateStockUseCase,
      useFactory: (stockRepo: StockRepository, stockTypeRepo: StockTypeRepository) => 
        new UpdateStockUseCase(stockRepo, stockTypeRepo),
      inject: [STOCK_REPOSITORY, STOCK_TYPE_REPOSITORY],
    },
    {
      provide: DeleteStockUseCase,
      useFactory: (stockRepo: StockRepository) => new DeleteStockUseCase(stockRepo),
      inject: [STOCK_REPOSITORY],
    },
    TypeOrmStockRepository,
    TypeOrmStockTypeRepository,
  ],
  exports: [STOCK_REPOSITORY, STOCK_TYPE_REPOSITORY],
})
export class StocksV2Module {}

