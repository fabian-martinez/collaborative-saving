import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { NOVELTY_LOSS_ACCOUNT } from '../../domain/constants/account-types';

@Injectable()
export class NoveltyPaymentStrategy implements PaymentStrategy {
  private readonly logger = new Logger(NoveltyPaymentStrategy.name);

  process(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): LedgerEntry[] {
    this.logger.warn(
      `Registrando novedad: ${payment.noveltyComment || 'Sin comentario'}`,
    );
    return [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: NOVELTY_LOSS_ACCOUNT,
        amount: payment.amount,
        description: `NOVEDAD: ${payment.noveltyComment || payment.description}`,
      }),
    ];
  }
}
