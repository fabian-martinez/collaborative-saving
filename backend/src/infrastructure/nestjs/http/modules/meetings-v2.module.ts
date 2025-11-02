import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Meeting } from '../../../typeorm/entities/meeting.entity';
import { Member } from '../../../typeorm/entities/member.entity';
import { Operation } from '../../../operations/entities/operation.entity';
import { LedgerEntry } from '../../../ledger-entries/entities/ledger-entry.entity';
import { Loan } from '../../../loans/entities/loan.entity';
import { LoanTransactionDetail } from '../../../loans/entities/loan-transaction-detail.entity';
import { MeetingsV2Controller } from '../controllers/meetings.v2.controller';
import { OpenMeetingUseCase } from '@application/use-cases/meetings/open-meeting.use-case';
import { CloseMeetingUseCase } from '@application/use-cases/meetings/close-meeting.use-case';
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/meetings/record-monthly-payments.use-case';
import { TypeOrmMeetingRepository } from '../../../typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmMemberRepository } from '../../../typeorm/repositories/typeorm-member.repository';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { OperationRecorder } from '../../../domain/services/operation-recorder.service';
import { LoanPaymentProcessor } from '../../../domain/services/loan-payment-processor.service';
import { DuesModule } from '../../../dues/dues.module';
import { DuesService } from '../../../dues/dues.service';

const MEETING_REPOSITORY = Symbol('MeetingRepository');
const MEMBER_REPOSITORY = Symbol('MemberRepository');

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      Member,
      Operation,
      LedgerEntry,
      Loan,
      LoanTransactionDetail,
    ]),
    DuesModule,
  ],
  controllers: [MeetingsV2Controller],
  providers: [
    // Repository implementations
    {
      provide: MEETING_REPOSITORY,
      useClass: TypeOrmMeetingRepository,
    },
    {
      provide: MEMBER_REPOSITORY,
      useClass: TypeOrmMemberRepository,
    },
    // Domain Services
    OperationRecorder,
    LoanPaymentProcessor,
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
    TypeOrmMeetingRepository,
    TypeOrmMemberRepository,
  ],
  exports: [MEETING_REPOSITORY],
})
export class MeetingsV2Module {}
