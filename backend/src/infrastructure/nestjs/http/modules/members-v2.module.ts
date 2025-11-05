import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersV2Controller } from '../controllers/members.v2.controller';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { GetMemberDuesForActiveMeetingQueryHandler } from '@application/queries/members/get-member-dues-for-active-meeting.query-handler';
import { GetMemberPaymentsQueryHandler } from '@application/queries/members/get-member-payments.query-handler';
import { CreateMemberUseCase } from '@application/use-cases/members/create-member.use-case';
import { UpdateMemberUseCase } from '@application/use-cases/members/update-member.use-case';
import { DeleteMemberUseCase } from '@application/use-cases/members/delete-member.use-case';
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/members/record-monthly-payments.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
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
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { TypeOrmLedgerEntryRepository } from '@infrastructure/typeorm/repositories/typeorm-ledger-entry.repository';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Operation as OperationEntity } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry as LedgerEntryEntity } from '@infrastructure/typeorm/entities/ledger-entry.entity';

const MEMBER_REPOSITORY = Symbol('MemberRepository');
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
      Operation,
      LedgerEntry,
      // Domain entities for hexagonal architecture
      OperationEntity,
      LedgerEntryEntity,
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
    // Domain services
    OperationBalanceValidator,
    PaymentMapperService,
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
        operationRepo: OperationRepository,
        recordOperationUseCase: RecordOperationUseCase,
      ) =>
        new RecordMonthlyPaymentsUseCase(
          memberRepo,
          meetingRepo,
          loanRepo,
          loanTransactionDetailRepo,
          operationRepo,
          recordOperationUseCase,
        ),
      inject: [
        MEMBER_REPOSITORY,
        MEETING_REPOSITORY,
        LOAN_REPOSITORY,
        LOAN_TRANSACTION_DETAIL_REPOSITORY,
        OPERATION_REPOSITORY,
        RecordOperationUseCase,
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
