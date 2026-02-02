import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersV2Controller } from '../controllers/members.v2.controller';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { GetMemberDuesForActiveMeetingQueryHandler } from '@application/queries/members/get-member-dues-for-active-meeting.query-handler';
import { GetMemberPaymentsQueryHandler } from '@application/queries/members/get-member-payments.query-handler';
import { GetMemberPurchasesQueryHandler } from '@application/queries/members/get-member-purchases.query-handler';
import { GetMemberStockExchangesQueryHandler } from '@application/queries/members/get-member-stock-exchanges.query-handler';
import { GetMemberStockTransfersQueryHandler } from '@application/queries/members/get-member-stock-transfers.query-handler';
import { GetMemberStockLoanPaymentsQueryHandler } from '@application/queries/members/get-member-stock-loan-payments.query-handler';
import { GetMemberPaymentScheduleQueryHandler } from '@application/queries/members/get-member-payment-schedule.query-handler';
import { GetMemberStockSubscriptionsQueryHandler } from '@application/queries/members/get-member-stock-subscriptions.query-handler';
import { GetStockSubscriptionByIdQueryHandler } from '@application/queries/members/get-stock-subscription-by-id.query-handler';
import { CreateMemberUseCase } from '@application/use-cases/members/create-member.use-case';
import { UpdateMemberUseCase } from '@application/use-cases/members/update-member.use-case';
import { DeleteMemberUseCase } from '@application/use-cases/members/delete-member.use-case';
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/members/record-monthly-payments.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { CalculateMemberInsuranceUseCase } from '@application/use-cases/members/calculate-member-insurance.use-case';
import { PurchaseStockUseCase } from '@application/use-cases/members/purchase-stock.use-case';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { LoansV2Module } from './loans-v2.module';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { TypeOrmMeetingRepository } from '@infrastructure/typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmMandatoryContributionRepository } from '@infrastructure/typeorm/repositories/typeorm-mandatory-contribution.repository';
import { TypeOrmStockSubscriptionRepository } from '@infrastructure/typeorm/repositories/typeorm-stock-subscription.repository';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmLoanTransactionDetailRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-transaction-detail.repository';
import { TypeOrmStockRepository } from '@infrastructure/typeorm/repositories/typeorm-stock.repository';
import { Member } from '@infrastructure/typeorm/entities/member.entity';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { MandatoryContribution } from '@infrastructure/typeorm/entities/mandatory-contribution.entity';
import { StockSubscription } from '@infrastructure/typeorm/entities/stock-subscription.entity';
import { Loan } from '@infrastructure/typeorm/entities/loan.entity';
import { LoanTransactionDetail } from '@infrastructure/typeorm/entities/loan-transaction-detail.entity';
import { Stock } from '@infrastructure/typeorm/entities/stock.entity';
import { PendingMemberPayment } from '@infrastructure/typeorm/entities/pending-member-payment.entity';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { PaymentProjectionService } from '@domain/services/payment-projection.service';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Operation as OperationEntity } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry as LedgerEntryEntity } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { TypeOrmPendingMemberPaymentRepository } from '@infrastructure/typeorm/repositories/typeorm-pending-member-payment.repository';
import { ProcessStockExchangeUseCase } from '@application/use-cases/members/process-stock-exchange.use-case';
import { ProcessStockTransferUseCase } from '@application/use-cases/members/process-stock-transfer.use-case';
import { ProcessStockLoanPaymentUseCase } from '@application/use-cases/members/process-stock-loan-payment.use-case';
import { MEMBER_REPOSITORY } from '@domain/constants/injection-tokens';

const MEETING_REPOSITORY = Symbol('MeetingRepository');
const MANDATORY_CONTRIBUTION_REPOSITORY = Symbol(
  'MandatoryContributionRepository',
);
const STOCK_SUBSCRIPTION_REPOSITORY = Symbol('StockSubscriptionRepository');
const LOAN_REPOSITORY = Symbol('LoanRepository');
const LOAN_TRANSACTION_DETAIL_REPOSITORY = Symbol(
  'LoanTransactionDetailRepository',
);
const STOCK_REPOSITORY = Symbol('StockRepository');
const OPERATION_REPOSITORY = Symbol('OperationRepository');
const LEDGER_ENTRY_REPOSITORY = Symbol('LedgerEntryRepository');
const TRANSACTION_MANAGER = Symbol('TransactionManager');
const PENDING_MEMBER_PAYMENT_REPOSITORY = Symbol(
  'PendingMemberPaymentRepository',
);

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      Meeting,
      MandatoryContribution,
      StockSubscription,
      Loan,
      LoanTransactionDetail,
      Stock,
      PendingMemberPayment,
      Operation,
      LedgerEntry,
      // Domain entities for hexagonal architecture
      OperationEntity,
      LedgerEntryEntity,
    ]),
    LoansV2Module,
  ],
  controllers: [MembersV2Controller],
  providers: [
    // Repository implementations
    {
      provide: MEMBER_REPOSITORY,
      useClass: TypeOrmMemberRepository,
    },
    {
      provide: MEETING_REPOSITORY,
      useClass: TypeOrmMeetingRepository,
    },
    {
      provide: MANDATORY_CONTRIBUTION_REPOSITORY,
      useClass: TypeOrmMandatoryContributionRepository,
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
      provide: LOAN_TRANSACTION_DETAIL_REPOSITORY,
      useClass: TypeOrmLoanTransactionDetailRepository,
    },
    {
      provide: STOCK_REPOSITORY,
      useClass: TypeOrmStockRepository,
    },
    {
      provide: PENDING_MEMBER_PAYMENT_REPOSITORY,
      useClass: TypeOrmPendingMemberPaymentRepository,
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
    // Query handlers
    {
      provide: GetMembersQueryHandler,
      useFactory: (repo: MemberRepository) => new GetMembersQueryHandler(repo),
      inject: [MEMBER_REPOSITORY],
    },
    {
      provide: GetMemberDetailQueryHandler,
      useFactory: (repo: MemberRepository) =>
        new GetMemberDetailQueryHandler(repo),
      inject: [MEMBER_REPOSITORY],
    },
    {
      provide: GetMemberDuesForActiveMeetingQueryHandler,
      useFactory: (
        meetingRepo: MeetingRepository,
        memberRepo: MemberRepository,
        mandatoryContributionRepo: MandatoryContributionRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        loanRepo: LoanRepository,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
        stockRepo: StockRepository,
      ) =>
        new GetMemberDuesForActiveMeetingQueryHandler(
          meetingRepo,
          memberRepo,
          mandatoryContributionRepo,
          stockSubscriptionRepo,
          loanRepo,
          loanTransactionDetailRepo,
          stockRepo,
        ),
      inject: [
        MEETING_REPOSITORY,
        MEMBER_REPOSITORY,
        MANDATORY_CONTRIBUTION_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        STOCK_REPOSITORY,
      ],
    },
    {
      provide: GetMemberPaymentsQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        paymentMapperService: PaymentMapperService,
      ): GetMemberPaymentsQueryHandler => {
        return new GetMemberPaymentsQueryHandler(
          memberRepo,
          operationRepo,
          ledgerEntryRepo,
          paymentMapperService,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        PaymentMapperService,
      ],
    },
    {
      provide: GetMemberPurchasesQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        stockRepo: StockRepository,
        loanRepo: LoanRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
      ): GetMemberPurchasesQueryHandler => {
        return new GetMemberPurchasesQueryHandler(
          memberRepo,
          stockSubscriptionRepo,
          stockRepo,
          loanRepo,
          operationRepo,
          ledgerEntryRepo,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        STOCK_REPOSITORY,
        LOAN_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
      ],
    },
    {
      provide: GetMemberStockExchangesQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        pendingMemberPaymentRepo: PendingMemberPaymentRepository,
        loanRepo: LoanRepository,
      ): GetMemberStockExchangesQueryHandler => {
        return new GetMemberStockExchangesQueryHandler(
          memberRepo,
          stockRepo,
          stockSubscriptionRepo,
          operationRepo,
          ledgerEntryRepo,
          pendingMemberPaymentRepo,
          loanRepo,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        LOAN_REPOSITORY,
      ],
    },
    {
      provide: GetMemberStockTransfersQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
      ): GetMemberStockTransfersQueryHandler => {
        return new GetMemberStockTransfersQueryHandler(
          memberRepo,
          stockRepo,
          stockSubscriptionRepo,
          operationRepo,
          ledgerEntryRepo,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
      ],
    },
    {
      provide: GetMemberStockLoanPaymentsQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        loanRepo: LoanRepository,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
      ): GetMemberStockLoanPaymentsQueryHandler => {
        return new GetMemberStockLoanPaymentsQueryHandler(
          memberRepo,
          stockRepo,
          stockSubscriptionRepo,
          loanRepo,
          loanTransactionDetailRepo,
          operationRepo,
          ledgerEntryRepo,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
      ],
    },
    {
      provide: GetMemberPaymentScheduleQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        loanRepo: LoanRepository,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        paymentProjectionService: PaymentProjectionService,
      ): GetMemberPaymentScheduleQueryHandler => {
        return new GetMemberPaymentScheduleQueryHandler(
          memberRepo,
          loanRepo,
          loanTransactionDetailRepo,
          operationRepo,
          ledgerEntryRepo,
          paymentProjectionService,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        PaymentProjectionService,
      ],
    },
    {
      provide: GetMemberStockSubscriptionsQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        stockRepo: StockRepository,
      ): GetMemberStockSubscriptionsQueryHandler => {
        return new GetMemberStockSubscriptionsQueryHandler(
          memberRepo,
          stockSubscriptionRepo,
          stockRepo,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        STOCK_REPOSITORY,
      ],
    },
    {
      provide: GetStockSubscriptionByIdQueryHandler,
      useFactory: (
        memberRepo: MemberRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        stockRepo: StockRepository,
      ): GetStockSubscriptionByIdQueryHandler => {
        return new GetStockSubscriptionByIdQueryHandler(
          memberRepo,
          stockSubscriptionRepo,
          stockRepo,
        );
      },
      inject: [
        MEMBER_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        STOCK_REPOSITORY,
      ],
    },
    // Use cases
    {
      provide: CreateMemberUseCase,
      useFactory: (repo: MemberRepository) => new CreateMemberUseCase(repo),
      inject: [MEMBER_REPOSITORY],
    },
    {
      provide: UpdateMemberUseCase,
      useFactory: (repo: MemberRepository) => new UpdateMemberUseCase(repo),
      inject: [MEMBER_REPOSITORY],
    },
    {
      provide: DeleteMemberUseCase,
      useFactory: (repo: MemberRepository) => new DeleteMemberUseCase(repo),
      inject: [MEMBER_REPOSITORY],
    },
    {
      provide: CalculateMemberInsuranceUseCase,
      useFactory: (
        stockSubscriptionRepo: StockSubscriptionRepository,
        loanRepo: LoanRepository,
        stockRepo: StockRepository,
      ) =>
        new CalculateMemberInsuranceUseCase(
          stockSubscriptionRepo,
          loanRepo,
          stockRepo,
        ),
      inject: [
        STOCK_SUBSCRIPTION_REPOSITORY,
        LOAN_REPOSITORY,
        STOCK_REPOSITORY,
      ],
    },
    // Domain services
    OperationBalanceValidator,
    PaymentMapperService,
    PaymentProjectionService,
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
      provide: RecordMonthlyPaymentsUseCase,
      useFactory: (
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        operationRepo: OperationRepository,
        recordOperationUseCase: RecordOperationUseCase,
        recordLoanPaymentUseCase: RecordLoanPaymentUseCase,
      ) =>
        new RecordMonthlyPaymentsUseCase(
          memberRepo,
          meetingRepo,
          operationRepo,
          recordOperationUseCase,
          recordLoanPaymentUseCase,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        OPERATION_REPOSITORY,
        RecordOperationUseCase,
        RecordLoanPaymentUseCase,
      ],
    },
    {
      provide: PurchaseStockUseCase,
      useFactory: (
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        createLoanUseCase: CreateLoanUseCase,
        recordOperationUseCase: RecordOperationUseCase,
        transactionMgr: TransactionManager,
      ) =>
        new PurchaseStockUseCase(
          memberRepo,
          meetingRepo,
          stockRepo,
          stockSubscriptionRepo,
          createLoanUseCase,
          recordOperationUseCase,
          transactionMgr,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        CreateLoanUseCase,
        RecordOperationUseCase,
        TRANSACTION_MANAGER,
      ],
    },
    {
      provide: ProcessStockExchangeUseCase,
      useFactory: (
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        pendingPaymentRepo: PendingMemberPaymentRepository,
        recordOperationUseCase: RecordOperationUseCase,
        createLoanUseCase: CreateLoanUseCase,
        recordLoanPaymentUseCase: RecordLoanPaymentUseCase,
        transactionMgr: TransactionManager,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
      ) =>
        new ProcessStockExchangeUseCase(
          memberRepo,
          meetingRepo,
          stockRepo,
          stockSubscriptionRepo,
          pendingPaymentRepo,
          recordOperationUseCase,
          createLoanUseCase,
          recordLoanPaymentUseCase,
          transactionMgr,
          loanTransactionDetailRepo,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        RecordOperationUseCase,
        CreateLoanUseCase,
        RecordLoanPaymentUseCase,
        TRANSACTION_MANAGER,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
      ],
    },
    {
      provide: ProcessStockTransferUseCase,
      useFactory: (
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new ProcessStockTransferUseCase(
          memberRepo,
          meetingRepo,
          stockRepo,
          stockSubscriptionRepo,
          recordOperationUseCase,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        RecordOperationUseCase,
      ],
    },
    {
      provide: ProcessStockLoanPaymentUseCase,
      useFactory: (
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        stockRepo: StockRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        recordOperationUseCase: RecordOperationUseCase,
        recordLoanPaymentUseCase: RecordLoanPaymentUseCase,
      ) =>
        new ProcessStockLoanPaymentUseCase(
          memberRepo,
          meetingRepo,
          stockRepo,
          stockSubscriptionRepo,
          recordOperationUseCase,
          recordLoanPaymentUseCase,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        STOCK_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        RecordOperationUseCase,
        RecordLoanPaymentUseCase,
      ],
    },
    // Repository instances for direct injection if needed
    TypeOrmMemberRepository,
    TypeOrmMeetingRepository,
    TypeOrmMandatoryContributionRepository,
    TypeOrmStockSubscriptionRepository,
    TypeOrmLoanRepository,
    TypeOrmLoanTransactionDetailRepository,
    TypeOrmStockRepository,
    TypeOrmOperationRepository,
    TypeOrmLedgerEntryRepository,
    TypeOrmTransactionManager,
  ],
})
export class MembersV2Module {}
