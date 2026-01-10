import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Stock } from '@infrastructure/typeorm/entities/stock.entity';
import { StockSubscription } from '@infrastructure/typeorm/entities/stock-subscription.entity';
import { Loan } from '@infrastructure/typeorm/entities/loan.entity';
import { StockValueHistory } from '@infrastructure/typeorm/entities/stock-value-history.entity';
import { PendingMemberPayment } from '@infrastructure/typeorm/entities/pending-member-payment.entity';
import { LoanTransactionDetail } from '@infrastructure/typeorm/entities/loan-transaction-detail.entity';
import { Member } from '@infrastructure/typeorm/entities/member.entity';
import { MeetingsV2Controller } from '../controllers/meetings.v2.controller';
import { OpenMeetingUseCase } from '@application/use-cases/meetings/open-meeting.use-case';
import { CloseMeetingUseCase } from '@application/use-cases/meetings/close-meeting.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { GetMeetingMonthlyPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-monthly-payments.query-handler';
import { GetMeetingPurchasesQueryHandler } from '@application/queries/meetings/get-meeting-purchases.query-handler';
import { GetMeetingStockTransfersQueryHandler } from '@application/queries/meetings/get-meeting-stock-transfers.query-handler';
import { GetMeetingStockExchangesQueryHandler } from '@application/queries/meetings/get-meeting-stock-exchanges.query-handler';
import { GetMeetingStockLoanPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-stock-loan-payments.query-handler';
import { GetMeetingsQueryHandler } from '@application/queries/meetings/get-meetings.query-handler';
import { GetMeetingQueryHandler } from '@application/queries/meetings/get-meeting.query-handler';
import { GetActiveMeetingQueryHandler } from '@application/queries/meetings/get-active-meeting.query-handler';
import { GetRevaluationQueryHandler } from '@application/queries/meetings/get-revaluation.query-handler';
import { GetDetailedMeetingSummaryQueryHandler } from '@application/queries/meetings/get-detailed-meeting-summary.query-handler';
import { RecordRevaluationUseCase } from '@application/use-cases/meetings/record-revaluation.use-case';
import { GetDisbursementPlanPreviewQueryHandler } from '@application/queries/meetings/get-disbursement-plan-preview.query-handler';
import { ExecuteDisbursementPlanUseCase } from '@application/use-cases/meetings/execute-disbursement-plan.use-case';
import { ProcessLoanDisbursementUseCase } from '@application/use-cases/meetings/process-loan-disbursement.use-case';
import { ProcessStockWithdrawalDisbursementUseCase } from '@application/use-cases/meetings/process-stock-withdrawal-disbursement.use-case';
import { ProcessDividendDisbursementUseCase } from '@application/use-cases/meetings/process-dividend-disbursement.use-case';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { LoansV2Module } from './loans-v2.module';
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
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { TypeOrmLoanTransactionDetailRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-transaction-detail.repository';
import { AssetRevaluationDomainService } from '@domain/services/asset-revaluation.service';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { StockWithdrawalCalculator } from '@domain/services/stock-withdrawal-calculator.service';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';

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
const MEMBER_REPOSITORY = Symbol('MemberRepository');
const LOAN_TRANSACTION_DETAIL_REPOSITORY = Symbol(
  'LoanTransactionDetailRepository',
);

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
      LoanTransactionDetail,
      Member,
    ]),
    LoansV2Module,
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
    {
      provide: MEMBER_REPOSITORY,
      useClass: TypeOrmMemberRepository,
    },
    {
      provide: LOAN_TRANSACTION_DETAIL_REPOSITORY,
      useClass: TypeOrmLoanTransactionDetailRepository,
    },
    // Domain Services
    StockWithdrawalCalculator,
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
        ledgerEntryRepo: LedgerEntryRepository,
        paymentMapperService: PaymentMapperService,
      ) =>
        new GetMeetingMonthlyPaymentsQueryHandler(
          meetingRepo,
          operationRepo,
          ledgerEntryRepo,
          paymentMapperService,
        ),
      inject: [
        MEETING_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        PaymentMapperService,
      ],
    },
    {
      provide: GetMeetingPurchasesQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        paymentMapperService: PaymentMapperService,
      ) =>
        new GetMeetingPurchasesQueryHandler(
          meetingRepo,
          operationRepo,
          ledgerEntryRepo,
          paymentMapperService,
        ),
      inject: [
        MEETING_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        PaymentMapperService,
      ],
    },
    {
      provide: GetMeetingStockTransfersQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
      ) => new GetMeetingStockTransfersQueryHandler(meetingRepo, operationRepo),
      inject: [MEETING_REPOSITORY, OPERATION_REPOSITORY],
    },
    {
      provide: GetMeetingStockExchangesQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
      ) => new GetMeetingStockExchangesQueryHandler(meetingRepo, operationRepo),
      inject: [MEETING_REPOSITORY, OPERATION_REPOSITORY],
    },
    {
      provide: GetMeetingStockLoanPaymentsQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
      ) =>
        new GetMeetingStockLoanPaymentsQueryHandler(meetingRepo, operationRepo),
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
    {
      provide: GetDetailedMeetingSummaryQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        summaryService: MeetingSummaryService,
      ) =>
        new GetDetailedMeetingSummaryQueryHandler(meetingRepo, summaryService),
      inject: [MEETING_REPOSITORY, MeetingSummaryService],
    },
    {
      provide: GetDisbursementPlanPreviewQueryHandler,
      useFactory: (
        pendingPaymentRepo: PendingMemberPaymentRepository,
        ledgerEntryRepo: LedgerEntryRepository,
      ) =>
        new GetDisbursementPlanPreviewQueryHandler(
          pendingPaymentRepo,
          ledgerEntryRepo,
        ),
      inject: [PENDING_MEMBER_PAYMENT_REPOSITORY, LEDGER_ENTRY_REPOSITORY],
    },
    // Use cases
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
      provide: OpenMeetingUseCase,
      useFactory: (
        meetingRepo: MeetingRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new OpenMeetingUseCase(
          meetingRepo,
          ledgerEntryRepo,
          recordOperationUseCase,
        ),
      inject: [
        MEETING_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        RecordOperationUseCase,
      ],
    },
    {
      provide: CloseMeetingUseCase,
      useFactory: (
        meetingRepo: MeetingRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new CloseMeetingUseCase(
          meetingRepo,
          ledgerEntryRepo,
          recordOperationUseCase,
        ),
      inject: [
        MEETING_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        RecordOperationUseCase,
      ],
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
    {
      provide: ProcessDividendDisbursementUseCase,
      useFactory: (
        pendingPaymentRepo: PendingMemberPaymentRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new ProcessDividendDisbursementUseCase(
          pendingPaymentRepo,
          ledgerEntryRepo,
          recordOperationUseCase,
        ),
      inject: [
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        RecordOperationUseCase,
      ],
    },
    {
      provide: ProcessLoanDisbursementUseCase,
      useFactory: (
        loanRepo: LoanRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        createLoanUseCase: CreateLoanUseCase,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new ProcessLoanDisbursementUseCase(
          loanRepo,
          pendingPaymentRepo,
          loanTransactionDetailRepo,
          memberRepo,
          meetingRepo,
          createLoanUseCase,
          recordOperationUseCase,
        ),
      inject: [
        LOAN_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        CreateLoanUseCase,
        RecordOperationUseCase,
      ],
    },
    {
      provide: ProcessStockWithdrawalDisbursementUseCase,
      useFactory: (
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        stockWithdrawalCalculator: StockWithdrawalCalculator,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new ProcessStockWithdrawalDisbursementUseCase(
          stockRepo,
          stockSubscriptionRepo,
          pendingPaymentRepo,
          ledgerEntryRepo,
          stockWithdrawalCalculator,
          recordOperationUseCase,
        ),
      inject: [
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        StockWithdrawalCalculator,
        RecordOperationUseCase,
      ],
    },
    {
      provide: ExecuteDisbursementPlanUseCase,
      useFactory: (
        meetingRepo: MeetingRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
        transactionManager: TransactionManager,
        processLoanDisbursementUseCase: ProcessLoanDisbursementUseCase,
        processStockWithdrawalDisbursementUseCase: ProcessStockWithdrawalDisbursementUseCase,
        processDividendDisbursementUseCase: ProcessDividendDisbursementUseCase,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new ExecuteDisbursementPlanUseCase(
          meetingRepo,
          ledgerEntryRepo,
          pendingPaymentRepo,
          transactionManager,
          processLoanDisbursementUseCase,
          processStockWithdrawalDisbursementUseCase,
          processDividendDisbursementUseCase,
          recordOperationUseCase,
        ),
      inject: [
        MEETING_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        TRANSACTION_MANAGER,
        ProcessLoanDisbursementUseCase,
        ProcessStockWithdrawalDisbursementUseCase,
        ProcessDividendDisbursementUseCase,
        RecordOperationUseCase,
      ],
    },
    // Services
    {
      provide: MeetingSummaryService,
      useFactory: (
        dataSource: DataSource,
        operationRepo: OperationRepository,
        stockValueHistoryRepo: StockValueHistoryRepository,
        loanRepo: LoanRepository,
        pendingMemberPaymentRepo: PendingMemberPaymentRepository,
        stockRepo: StockRepository,
      ) =>
        new MeetingSummaryService(
          dataSource,
          operationRepo,
          stockValueHistoryRepo,
          loanRepo,
          pendingMemberPaymentRepo,
          stockRepo,
        ),
      inject: [
        DataSource,
        OPERATION_REPOSITORY,
        STOCK_VALUE_HISTORY_REPOSITORY,
        LOAN_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        STOCK_REPOSITORY,
      ],
    },
    PaymentMapperService,
    // Repository instances for direct injection if needed
    TypeOrmMeetingRepository,
    TypeOrmOperationRepository,
  ],
  exports: [MEETING_REPOSITORY],
})
export class MeetingsV2Module {}
