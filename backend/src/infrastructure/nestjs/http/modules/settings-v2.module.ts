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
import { DeleteInterestDistributionConfigUseCase } from '@application/use-cases/settings/delete-interest-distribution-config.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';

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
      provide: DeleteInterestDistributionConfigUseCase,
      useFactory: (repo: InterestDistributionConfigRepository) => 
        new DeleteInterestDistributionConfigUseCase(repo),
      inject: [INTEREST_DISTRIBUTION_CONFIG_REPOSITORY],
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
    DeleteInterestDistributionConfigUseCase,
  ],
})
export class SettingsV2Module {}
