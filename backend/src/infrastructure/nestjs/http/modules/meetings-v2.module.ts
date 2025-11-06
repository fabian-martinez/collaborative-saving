import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Stock } from '@infrastructure/typeorm/entities/stock.entity';
import { StockSubscription } from '@infrastructure/typeorm/entities/stock-subscription.entity';
import { Loan } from '@infrastructure/typeorm/entities/loan.entity';
import { StockValueHistory } from '@infrastructure/typeorm/entities/stock-value-history.entity';
import { PendingMemberPayment } from '@infrastructure/typeorm/entities/pending-member-payment.entity';
import { MeetingsV2Controller } from '../controllers/meetings.v2.controller';
import { OpenMeetingUseCase } from '@application/use-cases/meetings/open-meeting.use-case';
import { CloseMeetingUseCase } from '@application/use-cases/meetings/close-meeting.use-case';
import { GetMeetingMonthlyPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-monthly-payments.query-handler';
import { GetMeetingsQueryHandler } from '@application/queries/meetings/get-meetings.query-handler';
import { GetMeetingQueryHandler } from '@application/queries/meetings/get-meeting.query-handler';
import { GetActiveMeetingQueryHandler } from '@application/queries/meetings/get-active-meeting.query-handler';
import { GetRevaluationQueryHandler } from '@application/queries/meetings/get-revaluation.query-handler';
import { RecordRevaluationUseCase } from '@application/use-cases/meetings/record-revaluation.use-case';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { TypeOrmMeetingRepository } from '@infrastructure/typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmStockRepository } from '@infrastructure/typeorm/repositories/typeorm-stock.repository';
import { TypeOrmStockSubscriptionRepository } from '@infrastructure/typeorm/repositories/typeorm-stock-subscription.repository';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmStockValueHistoryRepository } from '@infrastructure/typeorm/repositories/typeorm-stock-value-history.repository';
import { TypeOrmPendingMemberPaymentRepository } from '@infrastructure/typeorm/repositories/typeorm-pending-member-payment.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { AssetRevaluationDomainService } from '@domain/services/asset-revaluation.service';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';

const MEETING_REPOSITORY = Symbol('MeetingRepository');
const OPERATION_REPOSITORY = Symbol('OperationRepository');
const LEDGER_ENTRY_REPOSITORY = Symbol('LedgerEntryRepository');
const STOCK_REPOSITORY = Symbol('StockRepository');
const STOCK_SUBSCRIPTION_REPOSITORY = Symbol('StockSubscriptionRepository');
const LOAN_REPOSITORY = Symbol('LoanRepository');
const STOCK_VALUE_HISTORY_REPOSITORY = Symbol('StockValueHistoryRepository');
const PENDING_MEMBER_PAYMENT_REPOSITORY = Symbol(
  'PendingMemberPaymentRepository',
);
const TRANSACTION_MANAGER = Symbol('TransactionManager');

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      Operation,
      LedgerEntry,
      Stock,
      StockSubscription,
      Loan,
      StockValueHistory,
      PendingMemberPayment,
    ]),
  ],
  controllers: [MeetingsV2Controller],
  providers: [
    // Repository implementations
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
      provide: STOCK_REPOSITORY,
      useClass: TypeOrmStockRepository,
    },
    {
      provide: STOCK_SUBSCRIPTION_REPOSITORY,
      useClass: TypeOrmStockSubscriptionRepository,
    },
    {
      provide: LOAN_REPOSITORY,
      useClass: TypeOrmLoanRepository,
    },
    {
      provide: STOCK_VALUE_HISTORY_REPOSITORY,
      useClass: TypeOrmStockValueHistoryRepository,
    },
    {
      provide: PENDING_MEMBER_PAYMENT_REPOSITORY,
      useClass: TypeOrmPendingMemberPaymentRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    // Domain Services
    {
      provide: AssetRevaluationDomainService,
      useFactory: (
        meetingRepo: MeetingRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        loanRepo: LoanRepository,
        operationRepo: OperationRepository,
        stockValueHistoryRepo: StockValueHistoryRepository,
      ) =>
        new AssetRevaluationDomainService(
          meetingRepo,
          ledgerEntryRepo,
          stockRepo,
          stockSubscriptionRepo,
          loanRepo,
          operationRepo,
          stockValueHistoryRepo,
        ),
      inject: [
        MEETING_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        LOAN_REPOSITORY,
        OPERATION_REPOSITORY,
        STOCK_VALUE_HISTORY_REPOSITORY,
      ],
    },
    OperationBalanceValidator,
    // Query handlers
    {
      provide: GetMeetingsQueryHandler,
      useFactory: (meetingRepo: MeetingRepository) =>
        new GetMeetingsQueryHandler(meetingRepo),
      inject: [MEETING_REPOSITORY],
    },
    {
      provide: GetMeetingQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        summaryService: MeetingSummaryService,
      ) => new GetMeetingQueryHandler(meetingRepo, summaryService),
      inject: [MEETING_REPOSITORY, MeetingSummaryService],
    },
    {
      provide: GetActiveMeetingQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        summaryService: MeetingSummaryService,
      ) => new GetActiveMeetingQueryHandler(meetingRepo, summaryService),
      inject: [MEETING_REPOSITORY, MeetingSummaryService],
    },
    {
      provide: GetMeetingMonthlyPaymentsQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
      ) =>
        new GetMeetingMonthlyPaymentsQueryHandler(meetingRepo, operationRepo),
      inject: [MEETING_REPOSITORY, OPERATION_REPOSITORY],
    },
    {
      provide: GetRevaluationQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
        revaluationService: AssetRevaluationDomainService,
      ) =>
        new GetRevaluationQueryHandler(
          meetingRepo,
          operationRepo,
          revaluationService,
        ),
      inject: [
        MEETING_REPOSITORY,
        OPERATION_REPOSITORY,
        AssetRevaluationDomainService,
      ],
    },
    // Use cases
    {
      provide: OpenMeetingUseCase,
      useFactory: (repo: MeetingRepository) => new OpenMeetingUseCase(repo),
      inject: [MEETING_REPOSITORY],
    },
    {
      provide: CloseMeetingUseCase,
      useFactory: (repo: MeetingRepository) => new CloseMeetingUseCase(repo),
      inject: [MEETING_REPOSITORY],
    },
    {
      provide: RecordRevaluationUseCase,
      useFactory: (
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        stockValueHistoryRepo: StockValueHistoryRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
        transactionManager: TransactionManager,
        revaluationService: AssetRevaluationDomainService,
        balanceValidator: OperationBalanceValidator,
      ) =>
        new RecordRevaluationUseCase(
          meetingRepo,
          operationRepo,
          ledgerEntryRepo,
          stockRepo,
          stockSubscriptionRepo,
          stockValueHistoryRepo,
          pendingPaymentRepo,
          transactionManager,
          revaluationService,
          balanceValidator,
        ),
      inject: [
        MEETING_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        STOCK_VALUE_HISTORY_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        TRANSACTION_MANAGER,
        AssetRevaluationDomainService,
        OperationBalanceValidator,
      ],
    },
    // Services
    MeetingSummaryService,
    // Repository instances for direct injection if needed
    TypeOrmMeetingRepository,
    TypeOrmOperationRepository,
  ],
  exports: [MEETING_REPOSITORY],
})
export class MeetingsV2Module {}
