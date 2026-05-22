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

import {
  STOCK_REPOSITORY,
  STOCK_SUBSCRIPTION_REPOSITORY,
  PENDING_MEMBER_PAYMENT_REPOSITORY,
  MEETING_REPOSITORY,
  OPERATION_REPOSITORY,
  LEDGER_ENTRY_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@domain/constants/injection-tokens';

import { StockSubscription } from '@infrastructure/typeorm/entities/stock-subscription.entity';
import { PendingMemberPayment } from '@infrastructure/typeorm/entities/pending-member-payment.entity';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';

import { TypeOrmStockSubscriptionRepository } from '../../../typeorm/repositories/typeorm-stock-subscription.repository';
import { TypeOrmPendingMemberPaymentRepository } from '../../../typeorm/repositories/typeorm-pending-member-payment.repository';
import { TypeOrmMeetingRepository } from '../../../typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmOperationRepository } from '../../../typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '../../../typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';

import { CreateCdtUseCase } from '@application/use-cases/stocks/create-cdt.use-case';
import { CloseCdtUseCase } from '@application/use-cases/stocks/close-cdt.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';

import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      StockSubscription,
      PendingMemberPayment,
      Meeting,
      Operation,
      LedgerEntry,
    ]),
  ],
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
    {
      provide: STOCK_SUBSCRIPTION_REPOSITORY,
      useClass: TypeOrmStockSubscriptionRepository,
    },
    {
      provide: PENDING_MEMBER_PAYMENT_REPOSITORY,
      useClass: TypeOrmPendingMemberPaymentRepository,
    },
    {
      provide: MEETING_REPOSITORY,
      useClass: TypeOrmMeetingRepository,
    },
    {
      provide: OPERATION_REPOSITORY,
      useClass: TypeOrmOperationRepository,
    },
    {
      provide: LEDGER_ENTRY_REPOSITORY,
      useClass: TypeOrmLedgerEntryRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    OperationBalanceValidator,
    {
      provide: RecordOperationUseCase,
      useFactory: (
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        transactionMgr: TransactionManager,
        balanceValidator: OperationBalanceValidator,
      ) =>
        new RecordOperationUseCase(
          operationRepo,
          ledgerEntryRepo,
          transactionMgr,
          balanceValidator,
        ),
      inject: [
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        TRANSACTION_MANAGER,
        OperationBalanceValidator,
      ],
    },
    {
      provide: CreateCdtUseCase,
      useFactory: (
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        meetingRepo: MeetingRepository,
        recordOperationUseCase: RecordOperationUseCase,
        transactionMgr: TransactionManager,
      ) =>
        new CreateCdtUseCase(
          stockRepo,
          stockSubscriptionRepo,
          meetingRepo,
          recordOperationUseCase,
          transactionMgr,
        ),
      inject: [
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        MEETING_REPOSITORY,
        RecordOperationUseCase,
        TRANSACTION_MANAGER,
      ],
    },
    {
      provide: CloseCdtUseCase,
      useFactory: (
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
      ) =>
        new CloseCdtUseCase(
          stockRepo,
          stockSubscriptionRepo,
          pendingPaymentRepo,
        ),
      inject: [
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
      ],
    },
    TypeOrmStockRepository,
    TypeOrmStockSubscriptionRepository,
    TypeOrmPendingMemberPaymentRepository,
    TypeOrmMeetingRepository,
    TypeOrmOperationRepository,
    TypeOrmLedgerEntryRepository,
    TypeOrmTransactionManager,
  ],
  exports: [STOCK_REPOSITORY, STOCK_SUBSCRIPTION_REPOSITORY],
})
export class StocksV2Module {}
