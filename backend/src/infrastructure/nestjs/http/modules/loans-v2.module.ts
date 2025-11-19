import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { TypeOrmMeetingRepository } from '@infrastructure/typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmLoanTransactionDetailRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-transaction-detail.repository';
import { TypeOrmPendingMemberPaymentRepository } from '@infrastructure/typeorm/repositories/typeorm-pending-member-payment.repository';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { Member } from '@infrastructure/typeorm/entities/member.entity';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Loan } from '@infrastructure/typeorm/entities/loan.entity';
import { LoanTransactionDetail } from '@infrastructure/typeorm/entities/loan-transaction-detail.entity';
import { PendingMemberPayment } from '@infrastructure/typeorm/entities/pending-member-payment.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';

const MEMBER_REPOSITORY = Symbol('MemberRepository');
const MEETING_REPOSITORY = Symbol('MeetingRepository');
const LOAN_REPOSITORY = Symbol('LoanRepository');
const LOAN_TRANSACTION_DETAIL_REPOSITORY = Symbol(
  'LoanTransactionDetailRepository',
);
const PENDING_MEMBER_PAYMENT_REPOSITORY = Symbol(
  'PendingMemberPaymentRepository',
);
const OPERATION_REPOSITORY = Symbol('OperationRepository');
const LEDGER_ENTRY_REPOSITORY = Symbol('LedgerEntryRepository');
const TRANSACTION_MANAGER = Symbol('TransactionManager');

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
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    // Domain services
    OperationBalanceValidator,
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
  ],
  exports: [CreateLoanUseCase],
})
export class LoansV2Module {}
