import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { UpdateLoanTermsUseCase } from '@application/use-cases/loans/update-loan-terms.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { UpdateLoanApprovedAmountUseCase } from '@application/use-cases/loans/update-loan-approved-amount.use-case';
import { GetLoansQueryHandler } from '@application/queries/loans/get-loans.query-handler';
import { GetLoanDetailQueryHandler } from '@application/queries/loans/get-loan-detail.query-handler';
import { GetMemberLoansQueryHandler } from '@application/queries/loans/get-member-loans.query-handler';
import { GetPaymentPlanSimulationQueryHandler } from '@application/queries/loans/get-payment-plan-simulation.query-handler';
import { SimulateLoanPaymentPlanUseCase } from '@application/use-cases/loans/simulate-loan-payment-plan.use-case';
import { LoansV2Controller } from '../controllers/loans.v2.controller';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { TypeOrmMeetingRepository } from '@infrastructure/typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmLoanTransactionDetailRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-transaction-detail.repository';
import { TypeOrmPendingMemberPaymentRepository } from '@infrastructure/typeorm/repositories/typeorm-pending-member-payment.repository';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmStockSubscriptionRepository } from '@infrastructure/typeorm/repositories/typeorm-stock-subscription.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { Member } from '@infrastructure/typeorm/entities/member.entity';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Loan } from '@infrastructure/typeorm/entities/loan.entity';
import { LoanTransactionDetail } from '@infrastructure/typeorm/entities/loan-transaction-detail.entity';
import { PendingMemberPayment } from '@infrastructure/typeorm/entities/pending-member-payment.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { StockSubscription } from '@infrastructure/typeorm/entities/stock-subscription.entity';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { EventBus } from '@domain/ports/services/event-bus.port';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { AmortizationCalculatorService } from '@domain/services/amortization-calculator.service';

import {
  MEMBER_REPOSITORY,
  MEETING_REPOSITORY,
  LOAN_REPOSITORY,
  LOAN_TRANSACTION_DETAIL_REPOSITORY,
  PENDING_MEMBER_PAYMENT_REPOSITORY,
  OPERATION_REPOSITORY,
  LEDGER_ENTRY_REPOSITORY,
  STOCK_SUBSCRIPTION_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@domain/constants/injection-tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      Meeting,
      Loan,
      LoanTransactionDetail,
      PendingMemberPayment,
      Operation,
      LedgerEntry,
      StockSubscription,
    ]),
  ],
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
      provide: LOAN_REPOSITORY,
      useClass: TypeOrmLoanRepository,
    },
    {
      provide: LOAN_TRANSACTION_DETAIL_REPOSITORY,
      useClass: TypeOrmLoanTransactionDetailRepository,
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
      provide: STOCK_SUBSCRIPTION_REPOSITORY,
      useClass: TypeOrmStockSubscriptionRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    // Domain services
    OperationBalanceValidator,
    AmortizationCalculatorService,
    // Query handlers
    {
      provide: GetLoansQueryHandler,
      useFactory: (loanRepo: LoanRepository) =>
        new GetLoansQueryHandler(loanRepo),
      inject: [LOAN_REPOSITORY],
    },
    {
      provide: GetLoanDetailQueryHandler,
      useFactory: (loanRepo: LoanRepository) =>
        new GetLoanDetailQueryHandler(loanRepo),
      inject: [LOAN_REPOSITORY],
    },
    {
      provide: GetMemberLoansQueryHandler,
      useFactory: (loanRepo: LoanRepository) =>
        new GetMemberLoansQueryHandler(loanRepo),
      inject: [LOAN_REPOSITORY],
    },
    {
      provide: GetPaymentPlanSimulationQueryHandler,
      useFactory: (amortizationService: AmortizationCalculatorService) =>
        new GetPaymentPlanSimulationQueryHandler(amortizationService),
      inject: [AmortizationCalculatorService],
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
      provide: CreateLoanUseCase,
      useFactory: (
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        loanRepo: LoanRepository,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
        pendingMemberPaymentRepo: PendingMemberPaymentRepository,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new CreateLoanUseCase(
          memberRepo,
          meetingRepo,
          loanRepo,
          loanTransactionDetailRepo,
          pendingMemberPaymentRepo,
          recordOperationUseCase,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        RecordOperationUseCase,
      ],
    },
    {
      provide: RecordLoanPaymentUseCase,
      useFactory: (
        loanRepo: LoanRepository,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
        recordOperationUseCase: RecordOperationUseCase,
        stockSubscriptionRepo: StockSubscriptionRepository,
        transactionMgr: TransactionManager,
      ) =>
        new RecordLoanPaymentUseCase(
          loanRepo,
          loanTransactionDetailRepo,
          recordOperationUseCase,
          stockSubscriptionRepo,
          transactionMgr,
        ),
      inject: [
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        RecordOperationUseCase,
        STOCK_SUBSCRIPTION_REPOSITORY,
        TRANSACTION_MANAGER,
      ],
    },
    {
      provide: UpdateLoanTermsUseCase,
      useFactory: (loanRepo: LoanRepository, eventBus: EventBus) =>
        new UpdateLoanTermsUseCase(loanRepo, eventBus),
      inject: [LOAN_REPOSITORY, EventBus],
    },
    {
      provide: SimulateLoanPaymentPlanUseCase,
      useFactory: (
        loanRepo: LoanRepository,
        amortizationService: AmortizationCalculatorService,
      ) => new SimulateLoanPaymentPlanUseCase(loanRepo, amortizationService),
      inject: [LOAN_REPOSITORY, AmortizationCalculatorService],
    },
    {
      provide: UpdateLoanApprovedAmountUseCase,
      useFactory: (
        loanRepo: LoanRepository,
        pendingMemberPaymentRepo: PendingMemberPaymentRepository,
        meetingRepo: MeetingRepository,
        transactionMgr: TransactionManager,
        eventBus: EventBus,
      ) =>
        new UpdateLoanApprovedAmountUseCase(
          loanRepo,
          pendingMemberPaymentRepo,
          meetingRepo,
          transactionMgr,
          eventBus,
        ),
      inject: [
        LOAN_REPOSITORY,
        PENDING_MEMBER_PAYMENT_REPOSITORY,
        MEETING_REPOSITORY,
        TRANSACTION_MANAGER,
        EventBus,
      ],
    },
  ],
  controllers: [LoansV2Controller],
  exports: [
    CreateLoanUseCase,
    RecordLoanPaymentUseCase,
    GetMemberLoansQueryHandler,
    LOAN_REPOSITORY,
  ],
})
export class LoansV2Module {}
