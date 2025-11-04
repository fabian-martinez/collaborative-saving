import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { DebtCapacityService } from './debt-capacity.service';
import { Member } from './entities/member.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Operation } from '../operations/entities/operation.entity';
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/members/record-monthly-payments.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { TypeOrmMeetingRepository } from '@infrastructure/typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmLoanTransactionDetailRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-transaction-detail.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Operation as OperationEntity } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry as LedgerEntryEntity } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Member as MemberEntity } from '@infrastructure/typeorm/entities/member.entity';
import { LoanTransactionDetail as LoanTransactionDetailEntity } from '@infrastructure/typeorm/entities/loan-transaction-detail.entity';

const MEMBER_REPOSITORY = Symbol('MemberRepository');
const MEETING_REPOSITORY = Symbol('MeetingRepository');
const OPERATION_REPOSITORY = Symbol('OperationRepository');
const LEDGER_ENTRY_REPOSITORY = Symbol('LedgerEntryRepository');
const LOAN_REPOSITORY = Symbol('LoanRepository');
const LOAN_TRANSACTION_DETAIL_REPOSITORY = Symbol(
  'LoanTransactionDetailRepository',
);
const TRANSACTION_MANAGER = Symbol('TransactionManager');

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      LedgerEntry,
      StockSubscription,
      Loan,
      Stock,
      Operation,
      // Domain entities for hexagonal architecture
      MemberEntity,
      Meeting,
      OperationEntity,
      LedgerEntryEntity,
      LoanTransactionDetailEntity,
    ]),
  ],
  controllers: [MembersController],
  providers: [
    MembersService,
    DebtCapacityService,
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
      provide: OPERATION_REPOSITORY,
      useClass: TypeOrmOperationRepository,
    },
    {
      provide: LEDGER_ENTRY_REPOSITORY,
      useClass: TypeOrmLedgerEntryRepository,
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
      provide: RecordMonthlyPaymentsUseCase,
      useFactory: (
        memberRepo: MemberRepository,
        meetingRepo: MeetingRepository,
        loanRepo: LoanRepository,
        loanTransactionDetailRepo: LoanTransactionDetailRepository,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new RecordMonthlyPaymentsUseCase(
          memberRepo,
          meetingRepo,
          loanRepo,
          loanTransactionDetailRepo,
          recordOperationUseCase,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        RecordOperationUseCase,
      ],
    },
    // Repository instances for direct injection if needed
    TypeOrmMemberRepository,
    TypeOrmMeetingRepository,
    TypeOrmOperationRepository,
    TypeOrmLedgerEntryRepository,
    TypeOrmLoanRepository,
    TypeOrmLoanTransactionDetailRepository,
    TypeOrmTransactionManager,
  ],
  exports: [MembersService, DebtCapacityService],
})
export class MembersModule {}
