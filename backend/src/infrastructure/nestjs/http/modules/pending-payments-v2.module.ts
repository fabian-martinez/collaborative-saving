import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingPaymentsController } from '../controllers/pending-payments.controller';
import { GetPendingPaymentsQueryHandler } from '@application/queries/pending-payments/get-pending-payments.query-handler';
import { UpdatePendingPaymentUseCase } from '@application/use-cases/pending-payments/update-pending-payment.use-case';
import { DeletePendingPaymentUseCase } from '@application/use-cases/pending-payments/delete-pending-payment.use-case';
import { TypeOrmPendingMemberPaymentRepository } from '@infrastructure/typeorm/repositories/typeorm-pending-member-payment.repository';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { PendingMemberPayment } from '@infrastructure/typeorm/entities/pending-member-payment.entity';
import { Member } from '@infrastructure/typeorm/entities/member.entity';
import { TypeOrmTransactionManager } from '@infrastructure/services/transaction-manager/typeorm-transaction-manager.service';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import {
  MEMBER_REPOSITORY,
  PENDING_MEMBER_PAYMENT_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@domain/constants/injection-tokens';

@Module({
  imports: [TypeOrmModule.forFeature([PendingMemberPayment, Member])],
  controllers: [PendingPaymentsController],
  providers: [
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    {
      provide: PENDING_MEMBER_PAYMENT_REPOSITORY,
      useClass: TypeOrmPendingMemberPaymentRepository,
    },
    {
      provide: MEMBER_REPOSITORY,
      useClass: TypeOrmMemberRepository,
    },
    {
      provide: GetPendingPaymentsQueryHandler,
      useFactory: (
        pendingMemberPaymentRepo: PendingMemberPaymentRepository,
        memberRepo: MemberRepository,
      ) =>
        new GetPendingPaymentsQueryHandler(
          pendingMemberPaymentRepo,
          memberRepo,
        ),
      inject: [PENDING_MEMBER_PAYMENT_REPOSITORY, MEMBER_REPOSITORY],
    },
    {
      provide: UpdatePendingPaymentUseCase,
      useFactory: (repo: PendingMemberPaymentRepository) =>
        new UpdatePendingPaymentUseCase(repo),
      inject: [PENDING_MEMBER_PAYMENT_REPOSITORY],
    },
    {
      provide: DeletePendingPaymentUseCase,
      useFactory: (repo: PendingMemberPaymentRepository) =>
        new DeletePendingPaymentUseCase(repo),
      inject: [PENDING_MEMBER_PAYMENT_REPOSITORY],
    },
  ],
})
export class PendingPaymentsV2Module {}
