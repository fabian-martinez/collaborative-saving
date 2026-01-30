import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanType } from '@infrastructure/typeorm/entities/loan-type.entity';
import { StockType } from '@infrastructure/typeorm/entities/stock-type.entity';
import { InterestDistributionConfig } from '@infrastructure/typeorm/entities/interest-distribution-config.entity';
import { SettingsV2Controller } from '../controllers/settings.v2.controller';
import { TypeOrmLoanTypeRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-type.repository';
import { TypeOrmStockTypeRepository } from '@infrastructure/typeorm/repositories/typeorm-stock-type.repository';
import { TypeOrmInterestDistributionConfigRepository } from '@infrastructure/typeorm/repositories/typeorm-interest-distribution-config.repository';
import { GetLoanTypesQueryHandler } from '@application/queries/settings/get-loan-types.query-handler';
import { GetStockTypesQueryHandler } from '@application/queries/settings/get-stock-types.query-handler';
import { GetInterestDistributionConfigsQueryHandler } from '@application/queries/settings/get-interest-distribution-configs.query-handler';
import { CreateInterestDistributionConfigUseCase } from '@application/use-cases/settings/create-interest-distribution-config.use-case';
import { UpdateInterestDistributionConfigUseCase } from '@application/use-cases/settings/update-interest-distribution-config.use-case';
import { DeleteInterestDistributionConfigUseCase } from '@application/use-cases/settings/delete-interest-distribution-config.use-case';
import { CreateLoanTypeUseCase } from '@application/use-cases/settings/create-loan-type.use-case';
import { UpdateLoanTypeUseCase } from '@application/use-cases/settings/update-loan-type.use-case';
import { DeleteLoanTypeUseCase } from '@application/use-cases/settings/delete-loan-type.use-case';
import { CreateStockTypeUseCase } from '@application/use-cases/settings/create-stock-type.use-case';
import { UpdateStockTypeUseCase } from '@application/use-cases/settings/update-stock-type.use-case';
import { DeleteStockTypeUseCase } from '@application/use-cases/settings/delete-stock-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StocksV2Module, STOCK_REPOSITORY } from './stocks-v2.module';
import { LoansV2Module, LOAN_REPOSITORY } from './loans-v2.module';

import { 
  LOAN_TYPE_REPOSITORY, 
  STOCK_TYPE_REPOSITORY, 
  INTEREST_DISTRIBUTION_CONFIG_REPOSITORY 
} from './settings.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanType,
      StockType,
      InterestDistributionConfig,
    ]),
    StocksV2Module,
    LoansV2Module,
  ],
  controllers: [SettingsV2Controller],
  providers: [
    // Repositories
    {
      provide: LOAN_TYPE_REPOSITORY,
      useClass: TypeOrmLoanTypeRepository,
    },
    {
      provide: STOCK_TYPE_REPOSITORY,
      useClass: TypeOrmStockTypeRepository,
    },
    {
      provide: INTEREST_DISTRIBUTION_CONFIG_REPOSITORY,
      useClass: TypeOrmInterestDistributionConfigRepository,
    },
    // Query Handlers
    {
      provide: GetLoanTypesQueryHandler,
      useFactory: (repo: LoanTypeRepository) => new GetLoanTypesQueryHandler(repo),
      inject: [LOAN_TYPE_REPOSITORY],
    },
    {
      provide: GetStockTypesQueryHandler,
      useFactory: (repo: StockTypeRepository) => new GetStockTypesQueryHandler(repo),
      inject: [STOCK_TYPE_REPOSITORY],
    },
    {
      provide: GetInterestDistributionConfigsQueryHandler,
      useFactory: (repo: InterestDistributionConfigRepository) => 
        new GetInterestDistributionConfigsQueryHandler(repo),
      inject: [INTEREST_DISTRIBUTION_CONFIG_REPOSITORY],
    },
    // Use Cases
    {
      provide: CreateInterestDistributionConfigUseCase,
      useFactory: (repo: InterestDistributionConfigRepository) => 
        new CreateInterestDistributionConfigUseCase(repo),
      inject: [INTEREST_DISTRIBUTION_CONFIG_REPOSITORY],
    },
    {
      provide: UpdateInterestDistributionConfigUseCase,
      useFactory: (repo: InterestDistributionConfigRepository) => 
        new UpdateInterestDistributionConfigUseCase(repo),
      inject: [INTEREST_DISTRIBUTION_CONFIG_REPOSITORY],
    },
    {
      provide: DeleteInterestDistributionConfigUseCase,
      useFactory: (repo: InterestDistributionConfigRepository) => 
        new DeleteInterestDistributionConfigUseCase(repo),
      inject: [INTEREST_DISTRIBUTION_CONFIG_REPOSITORY],
    },
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
        ltRepo: LoanTypeRepository,
        loanRepo: LoanRepository,
        configRepo: InterestDistributionConfigRepository,
      ) => new DeleteLoanTypeUseCase(ltRepo, loanRepo, configRepo),
      inject: [
        LOAN_TYPE_REPOSITORY,
        LOAN_REPOSITORY,
        INTEREST_DISTRIBUTION_CONFIG_REPOSITORY,
      ],
    },
    {
      provide: CreateStockTypeUseCase,
      useFactory: (repo: StockTypeRepository) => new CreateStockTypeUseCase(repo),
      inject: [STOCK_TYPE_REPOSITORY],
    },
    {
      provide: UpdateStockTypeUseCase,
      useFactory: (repo: StockTypeRepository) => new UpdateStockTypeUseCase(repo),
      inject: [STOCK_TYPE_REPOSITORY],
    },
    {
      provide: DeleteStockTypeUseCase,
      useFactory: (
        stRepo: StockTypeRepository,
        stockRepo: StockRepository,
        configRepo: InterestDistributionConfigRepository,
      ) => new DeleteStockTypeUseCase(stRepo, stockRepo, configRepo),
      inject: [
        STOCK_TYPE_REPOSITORY,
        STOCK_REPOSITORY,
        INTEREST_DISTRIBUTION_CONFIG_REPOSITORY,
      ],
    },
  ],
  exports: [
    LOAN_TYPE_REPOSITORY,
    STOCK_TYPE_REPOSITORY,
    INTEREST_DISTRIBUTION_CONFIG_REPOSITORY,
    GetLoanTypesQueryHandler,
    GetStockTypesQueryHandler,
    GetInterestDistributionConfigsQueryHandler,
    CreateInterestDistributionConfigUseCase,
    UpdateInterestDistributionConfigUseCase,
    DeleteInterestDistributionConfigUseCase,
    CreateLoanTypeUseCase,
    UpdateLoanTypeUseCase,
    DeleteLoanTypeUseCase,
    CreateStockTypeUseCase,
    UpdateStockTypeUseCase,
    DeleteStockTypeUseCase,
  ],
})
export class SettingsV2Module {}
