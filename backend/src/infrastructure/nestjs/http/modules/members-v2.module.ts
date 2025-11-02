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
import { Operation } from '../../../operations/entities/operation.entity';
import { LedgerEntry } from '../../../ledger-entries/entities/ledger-entry.entity';
import { Loan } from '../../../loans/entities/loan.entity';
import { LoanTransactionDetail } from '../../../loans/entities/loan-transaction-detail.entity';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRecorder } from '@domain/services/operation-recorder.service';
import { LoanPaymentProcessor } from '@domain/services/loan-payment-processor.service';
import { DuesModule } from '../../../dues/dues.module';
import { DuesService } from '../../../dues/dues.service';

const MEMBER_REPOSITORY = Symbol('MemberRepository');
const MEETING_REPOSITORY = Symbol('MeetingRepository');

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      Meeting,
      Operation,
      LedgerEntry,
      Loan,
      LoanTransactionDetail,
    ]),
    DuesModule,
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
    // Domain Services
    OperationRecorder,
    LoanPaymentProcessor,
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
        duesService: DuesService,
        meetingRepo: MeetingRepository,
        memberRepo: MemberRepository,
        dataSource: DataSource,
      ) =>
        new RecordMonthlyPaymentsUseCase(
          operationRecorder,
          loanPaymentProcessor,
          duesService,
          meetingRepo,
          memberRepo,
          dataSource,
        ),
      inject: [
        OperationRecorder,
        LoanPaymentProcessor,
        DuesService,
        MEETING_REPOSITORY,
        MEMBER_REPOSITORY,
        DataSource,
      ],
    },
    TypeOrmMemberRepository,
    TypeOrmMeetingRepository,
  ],
})
export class MembersV2Module {}
