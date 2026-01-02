import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingV2Controller } from '../controllers/accounting.v2.controller';
import { GetOperationsQueryHandler } from '@application/queries/accounting/get-operations.query-handler';
import { GetLedgerEntriesQueryHandler } from '@application/queries/accounting/get-ledger-entries.query-handler';
import { GetAccountsSummaryQueryHandler } from '@application/queries/accounting/get-accounts-summary.query-handler';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Operation as OperationEntity } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry as LedgerEntryEntity } from '@infrastructure/typeorm/entities/ledger-entry.entity';

const OPERATION_REPOSITORY = Symbol('OperationRepository');
const LEDGER_ENTRY_REPOSITORY = Symbol('LedgerEntryRepository');

@Module({
  imports: [
    TypeOrmModule.forFeature([OperationEntity, LedgerEntryEntity]),
  ],
  controllers: [AccountingV2Controller],
  providers: [
    // Repository implementations
    {
      provide: OPERATION_REPOSITORY,
      useClass: TypeOrmOperationRepository,
    },
    {
      provide: LEDGER_ENTRY_REPOSITORY,
      useClass: TypeOrmLedgerEntryRepository,
    },
    // Query handlers
    {
      provide: GetOperationsQueryHandler,
      useFactory: (
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
      ) => new GetOperationsQueryHandler(operationRepo, ledgerEntryRepo),
      inject: [OPERATION_REPOSITORY, LEDGER_ENTRY_REPOSITORY],
    },
    {
      provide: GetLedgerEntriesQueryHandler,
      useFactory: (ledgerEntryRepo: LedgerEntryRepository) =>
        new GetLedgerEntriesQueryHandler(ledgerEntryRepo),
      inject: [LEDGER_ENTRY_REPOSITORY],
    },
    {
      provide: GetAccountsSummaryQueryHandler,
      useFactory: (ledgerEntryRepo: LedgerEntryRepository) =>
        new GetAccountsSummaryQueryHandler(ledgerEntryRepo),
      inject: [LEDGER_ENTRY_REPOSITORY],
    },
    // Repository instances for direct injection if needed
    TypeOrmOperationRepository,
    TypeOrmLedgerEntryRepository,
  ],
  exports: [OPERATION_REPOSITORY, LEDGER_ENTRY_REPOSITORY],
})
export class AccountingV2Module {}

