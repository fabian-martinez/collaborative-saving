/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanType as LoanTypeEntity } from '@infrastructure/typeorm/entities/loan-type.entity';
import { Loan as LoanEntity } from '@infrastructure/typeorm/entities/loan.entity';
import { StockType as StockTypeEntity } from '@infrastructure/typeorm/entities/stock-type.entity';
import { Stock as StockEntity } from '@infrastructure/typeorm/entities/stock.entity';
import { TypeOrmLoanTypeRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-type.repository';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmStockTypeRepository } from '@infrastructure/typeorm/repositories/typeorm-stock-type.repository';
import { TypeOrmStockRepository } from '@infrastructure/typeorm/repositories/typeorm-stock.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import {
  LOAN_TYPE_REPOSITORY,
  LOAN_REPOSITORY,
  STOCK_TYPE_REPOSITORY,
  STOCK_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@domain/constants/injection-tokens';
import { CreateLoanTypeUseCase } from '@application/use-cases/settings/create-loan-type.use-case';
import { UpdateLoanTypeUseCase } from '@application/use-cases/settings/update-loan-type.use-case';
import { DeleteLoanTypeUseCase } from '@application/use-cases/settings/delete-loan-type.use-case';
import { GetLoanTypesQueryHandler } from '@application/queries/settings/get-loan-types.query-handler';
import { GetLoanTypeDetailQueryHandler } from '@application/queries/settings/get-loan-type-detail.query-handler';
import { CreateStockTypeUseCase } from '@application/use-cases/settings/create-stock-type.use-case';
import { UpdateStockTypeUseCase } from '@application/use-cases/settings/update-stock-type.use-case';
import { DeleteStockTypeUseCase } from '@application/use-cases/settings/delete-stock-type.use-case';
import { GetStockTypesQueryHandler } from '@application/queries/settings/get-stock-types.query-handler';
import { GetStockTypeDetailQueryHandler } from '@application/queries/settings/get-stock-type-detail.query-handler';
import { LoanTypesV2Controller } from '../controllers/loan-types.v2.controller';
import { StockTypesV2Controller } from '../controllers/stock-types.v2.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanTypeEntity,
      LoanEntity,
      StockTypeEntity,
      StockEntity,
    ]),
  ],
  controllers: [LoanTypesV2Controller, StockTypesV2Controller],
  providers: [
    // Repositories
    {
      provide: LOAN_TYPE_REPOSITORY,
      useClass: TypeOrmLoanTypeRepository,
    },
    {
      provide: LOAN_REPOSITORY,
      useClass: TypeOrmLoanRepository,
    },
    {
      provide: STOCK_TYPE_REPOSITORY,
      useClass: TypeOrmStockTypeRepository,
    },
    {
      provide: STOCK_REPOSITORY,
      useClass: TypeOrmStockRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    TypeOrmLoanTypeRepository,
    TypeOrmLoanRepository,
    TypeOrmStockTypeRepository,
    TypeOrmStockRepository,

    // Query Handlers - Loan Types
    {
      provide: GetLoanTypesQueryHandler,
      useFactory: (repo: LoanTypeRepository) =>
        new GetLoanTypesQueryHandler(repo),
      inject: [LOAN_TYPE_REPOSITORY],
    },
    {
      provide: GetLoanTypeDetailQueryHandler,
      useFactory: (repo: LoanTypeRepository) =>
        new GetLoanTypeDetailQueryHandler(repo),
      inject: [LOAN_TYPE_REPOSITORY],
    },

    // Query Handlers - Stock Types
    {
      provide: GetStockTypesQueryHandler,
      useFactory: (repo: StockTypeRepository) =>
        new GetStockTypesQueryHandler(repo),
      inject: [STOCK_TYPE_REPOSITORY],
    },
    {
      provide: GetStockTypeDetailQueryHandler,
      useFactory: (repo: StockTypeRepository) =>
        new GetStockTypeDetailQueryHandler(repo),
      inject: [STOCK_TYPE_REPOSITORY],
    },

    // Use Cases - Loan Types
    {
      provide: CreateLoanTypeUseCase,
      useFactory: (repo: LoanTypeRepository) => new CreateLoanTypeUseCase(repo),
      inject: [LOAN_TYPE_REPOSITORY],
    },
    {
      provide: UpdateLoanTypeUseCase,
      useFactory: (repo: LoanTypeRepository) => new UpdateLoanTypeUseCase(repo),
      inject: [LOAN_TYPE_REPOSITORY],
    },
    {
      provide: DeleteLoanTypeUseCase,
      useFactory: (
        loanTypeRepo: LoanTypeRepository,
        loanRepo: LoanRepository,
      ) => new DeleteLoanTypeUseCase(loanTypeRepo, loanRepo),
      inject: [LOAN_TYPE_REPOSITORY, LOAN_REPOSITORY],
    },

    // Use Cases - Stock Types
    {
      provide: CreateStockTypeUseCase,
      useFactory: (repo: StockTypeRepository) =>
        new CreateStockTypeUseCase(repo),
      inject: [STOCK_TYPE_REPOSITORY],
    },
    {
      provide: UpdateStockTypeUseCase,
      useFactory: (repo: StockTypeRepository) =>
        new UpdateStockTypeUseCase(repo),
      inject: [STOCK_TYPE_REPOSITORY],
    },
    {
      provide: DeleteStockTypeUseCase,
      useFactory: (
        stockTypeRepo: StockTypeRepository,
        stockRepo: StockRepository,
      ) => new DeleteStockTypeUseCase(stockTypeRepo, stockRepo),
      inject: [STOCK_TYPE_REPOSITORY, STOCK_REPOSITORY],
    },
  ],
  exports: [
    LOAN_TYPE_REPOSITORY,
    STOCK_TYPE_REPOSITORY,
    GetLoanTypesQueryHandler,
    GetLoanTypeDetailQueryHandler,
    CreateLoanTypeUseCase,
    UpdateLoanTypeUseCase,
    DeleteLoanTypeUseCase,
    GetStockTypesQueryHandler,
    GetStockTypeDetailQueryHandler,
    CreateStockTypeUseCase,
    UpdateStockTypeUseCase,
    DeleteStockTypeUseCase,
  ],
})
export class SettingsV2Module {}
