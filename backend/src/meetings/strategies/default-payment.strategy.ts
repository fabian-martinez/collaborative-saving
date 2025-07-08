import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { PENDING_CLASSIFICATION_ACCOUNT } from '../../common/constants/account-types';

@Injectable()
export class DefaultPaymentStrategy implements PaymentStrategy {
  private readonly logger = new Logger(DefaultPaymentStrategy.name);

  process(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): LedgerEntry[] {
    this.logger.warn(
      `Unhandled payment type received: ${payment.type}. Using pending classification account.`,
    );
    return [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: PENDING_CLASSIFICATION_ACCOUNT,
        amount: -payment.amount,
        description: `Clasificación pendiente para: ${payment.description}`,
      }),
    ];
  }
}
