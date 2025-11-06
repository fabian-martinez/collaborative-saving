import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from '@infrastructure/typeorm/entities/meeting.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { MeetingsV2Controller } from '../controllers/meetings.v2.controller';
import { OpenMeetingUseCase } from '@application/use-cases/meetings/open-meeting.use-case';
import { CloseMeetingUseCase } from '@application/use-cases/meetings/close-meeting.use-case';
import { GetMeetingMonthlyPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-monthly-payments.query-handler';
import { GetMeetingsQueryHandler } from '@application/queries/meetings/get-meetings.query-handler';
import { GetMeetingQueryHandler } from '@application/queries/meetings/get-meeting.query-handler';
import { GetActiveMeetingQueryHandler } from '@application/queries/meetings/get-active-meeting.query-handler';
import { MeetingSummaryService } from '@application/services/meeting-summary.service';
import { TypeOrmMeetingRepository } from '@infrastructure/typeorm/repositories/typeorm-meeting.repository';
import { TypeOrmOperationRepository } from '@infrastructure/typeorm/repositories/typeorm-operation.repository';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';

const MEETING_REPOSITORY = Symbol('MeetingRepository');
const OPERATION_REPOSITORY = Symbol('OperationRepository');

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Operation, LedgerEntry])],
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
      ) =>
        new GetMeetingMonthlyPaymentsQueryHandler(meetingRepo, operationRepo),
      inject: [MEETING_REPOSITORY, OPERATION_REPOSITORY],
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
    // Services
    MeetingSummaryService,
    // Repository instances for direct injection if needed
    TypeOrmMeetingRepository,
    TypeOrmOperationRepository,
  ],
  exports: [MEETING_REPOSITORY],
})
export class MeetingsV2Module {}
