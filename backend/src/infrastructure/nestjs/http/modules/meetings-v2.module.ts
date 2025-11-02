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
import { TypeOrmMeetingRepository } from '../../../typeorm/repositories/typeorm-meeting.repository';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';

const MEETING_REPOSITORY = Symbol('MeetingRepository');

@Module({
  imports: [TypeOrmModule.forFeature([Meeting])],
  controllers: [MeetingsV2Controller],
  providers: [
    // Repository implementations
    {
      provide: MEETING_REPOSITORY,
      useClass: TypeOrmMeetingRepository,
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
    TypeOrmMeetingRepository,
  ],
  exports: [MEETING_REPOSITORY],
})
export class MeetingsV2Module {}
