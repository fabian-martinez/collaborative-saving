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
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { TypeOrmStockSubscriptionRepository } from '../../../typeorm/repositories/typeorm-stock-subscription.repository';
import { StockSubscription } from '@infrastructure/typeorm/entities/stock-subscription.entity';

export const STOCK_REPOSITORY = Symbol('StockRepository');
export const STOCK_TYPE_REPOSITORY = Symbol('StockTypeRepository');
export const STOCK_SUBSCRIPTION_REPOSITORY = Symbol('StockSubscriptionRepository');

@Module({
  imports: [TypeOrmModule.forFeature([Stock, StockType, StockSubscription])],
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
    {
      provide: STOCK_SUBSCRIPTION_REPOSITORY,
      useClass: TypeOrmStockSubscriptionRepository,
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
      useFactory: (
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
      ) => new DeleteStockUseCase(stockRepo, stockSubscriptionRepo),
      inject: [STOCK_REPOSITORY, STOCK_SUBSCRIPTION_REPOSITORY],
    },
    TypeOrmStockRepository,
    TypeOrmStockTypeRepository,
  ],
  exports: [STOCK_REPOSITORY, STOCK_TYPE_REPOSITORY],
})
export class StocksV2Module {}

