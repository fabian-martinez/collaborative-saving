/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanType as LoanTypeEntity } from '@infrastructure/typeorm/entities/loan-type.entity';
import { Loan as LoanEntity } from '@infrastructure/typeorm/entities/loan.entity';
import { TypeOrmLoanTypeRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-type.repository';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import {
  LOAN_TYPE_REPOSITORY,
  LOAN_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@domain/constants/injection-tokens';
import { CreateLoanTypeUseCase } from '@application/use-cases/settings/create-loan-type.use-case';
import { UpdateLoanTypeUseCase } from '@application/use-cases/settings/update-loan-type.use-case';
import { DeleteLoanTypeUseCase } from '@application/use-cases/settings/delete-loan-type.use-case';
import { GetLoanTypesQueryHandler } from '@application/queries/settings/get-loan-types.query-handler';
import { GetLoanTypeDetailQueryHandler } from '@application/queries/settings/get-loan-type-detail.query-handler';
import { LoanTypesV2Controller } from '../controllers/loan-types.v2.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanTypeEntity, LoanEntity])],
  controllers: [LoanTypesV2Controller],
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
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    TypeOrmLoanTypeRepository,
    TypeOrmLoanRepository,

    // Query Handlers
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

    // Use Cases
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
  ],
  exports: [
    LOAN_TYPE_REPOSITORY,
    GetLoanTypesQueryHandler,
    GetLoanTypeDetailQueryHandler,
    CreateLoanTypeUseCase,
    UpdateLoanTypeUseCase,
    DeleteLoanTypeUseCase,
  ],
})
export class SettingsV2Module {}
