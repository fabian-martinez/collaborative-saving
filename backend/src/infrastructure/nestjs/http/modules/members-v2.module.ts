import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MembersV2Controller } from '../controllers/members.v2.controller';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { CreateMemberUseCase } from '@application/use-cases/members/create-member.use-case';
import { UpdateMemberUseCase } from '@application/use-cases/members/update-member.use-case';
import { DeleteMemberUseCase } from '@application/use-cases/members/delete-member.use-case';
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/meetings/record-monthly-payments.use-case';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { TypeOrmMeetingRepository } from '@infrastructure/typeorm/repositories/typeorm-meeting.repository';
import { Member } from '@infrastructure/typeorm/entities/member.entity';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Operation } from '../../../../operations/entities/operation.entity';
import { LedgerEntry } from '../../../../ledger-entries/entities/ledger-entry.entity';
import { Loan } from '../../../../loans/entities/loan.entity';
import { LoanTransactionDetail } from '../../../../loans/entities/loan-transaction-detail.entity';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRecorder } from '@domain/services/operation-recorder.service';
import { LoanPaymentProcessor } from '@domain/services/loan-payment-processor.service';
import { DuesCalculationService } from '@domain/services/dues-calculation.service';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { TypeOrmLoanRepository } from '@infrastructure/typeorm/repositories/typeorm-loan.repository';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmLoanTransactionDetailRepository } from '@infrastructure/typeorm/repositories/typeorm-loan-transaction-detail.repository';
import { TypeOrmStockSubscriptionRepository } from '@infrastructure/typeorm/repositories/typeorm-stock-subscription.repository';
import { TypeOrmMandatoryContributionRepository } from '@infrastructure/typeorm/repositories/typeorm-mandatory-contribution.repository';
import { StockSubscription } from '../../../../stock-subscriptions/entities/stock-subscription.entity';
import { MandatoryContribution } from '../../../../mandatory-contributions/entities/mandatory-contribution.entity';

const MEMBER_REPOSITORY = Symbol('MemberRepository');
const MEETING_REPOSITORY = Symbol('MeetingRepository');
const LOAN_REPOSITORY = Symbol('LoanRepository');
const OPERATION_REPOSITORY = Symbol('OperationRepository');
const LEDGER_ENTRY_REPOSITORY = Symbol('LedgerEntryRepository');
const LOAN_TRANSACTION_DETAIL_REPOSITORY = Symbol('LoanTransactionDetailRepository');
const STOCK_SUBSCRIPTION_REPOSITORY = Symbol('StockSubscriptionRepository');
const MANDATORY_CONTRIBUTION_REPOSITORY = Symbol('MandatoryContributionRepository');

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      Meeting,
      Operation,
      LedgerEntry,
      Loan,
      LoanTransactionDetail,
      StockSubscription,
      MandatoryContribution,
    ]),
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
      provide: LOAN_REPOSITORY,
      useClass: TypeOrmLoanRepository,
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
      provide: LOAN_TRANSACTION_DETAIL_REPOSITORY,
      useClass: TypeOrmLoanTransactionDetailRepository,
    },
    {
      provide: STOCK_SUBSCRIPTION_REPOSITORY,
      useClass: TypeOrmStockSubscriptionRepository,
    },
    {
      provide: MANDATORY_CONTRIBUTION_REPOSITORY,
      useClass: TypeOrmMandatoryContributionRepository,
    },
    // Domain Services
    OperationRecorder,
    LoanPaymentProcessor,
    {
      provide: DuesCalculationService,
      useFactory: (
        mandatoryContributionRepo: MandatoryContributionRepository,
        stockSubscriptionRepo: StockSubscriptionRepository,
        loanRepo: LoanRepository,
        loanTransactionRepo: LoanTransactionDetailRepository,
        meetingRepo: MeetingRepository,
      ) =>
        new DuesCalculationService(
          mandatoryContributionRepo,
          stockSubscriptionRepo,
          loanRepo,
          loanTransactionRepo,
          meetingRepo,
        ),
      inject: [
        MANDATORY_CONTRIBUTION_REPOSITORY,
        STOCK_SUBSCRIPTION_REPOSITORY,
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        MEETING_REPOSITORY,
      ],
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
      provide: RecordMonthlyPaymentsUseCase,
      useFactory: (
        operationRecorder: OperationRecorder,
        loanPaymentProcessor: LoanPaymentProcessor,
        duesCalculationService: DuesCalculationService,
        meetingRepo: MeetingRepository,
        memberRepo: MemberRepository,
        loanRepo: LoanRepository,
        operationRepo: OperationRepository,
        ledgerEntryRepo: LedgerEntryRepository,
        loanTransactionRepo: LoanTransactionDetailRepository,
        dataSource: DataSource,
      ) =>
        new RecordMonthlyPaymentsUseCase(
          operationRecorder,
          loanPaymentProcessor,
          duesCalculationService,
          meetingRepo,
          memberRepo,
          loanRepo,
          operationRepo,
          ledgerEntryRepo,
          loanTransactionRepo,
          dataSource,
        ),
      inject: [
        OperationRecorder,
        LoanPaymentProcessor,
        DuesCalculationService,
        MEETING_REPOSITORY,
        MEMBER_REPOSITORY,
        LOAN_REPOSITORY,
        OPERATION_REPOSITORY,
        LEDGER_ENTRY_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        DataSource,
      ],
    },
    TypeOrmMemberRepository,
    TypeOrmMeetingRepository,
    TypeOrmLoanRepository,
    TypeOrmOperationRepository,
    TypeOrmLedgerEntryRepository,
    TypeOrmLoanTransactionDetailRepository,
    TypeOrmStockSubscriptionRepository,
    TypeOrmMandatoryContributionRepository,
  ],
})
export class MembersV2Module {}
