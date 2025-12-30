import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { STOCK_CAPITAL_ACCOUNT } from '../../domain/constants/account-types';

@Injectable()
export class StockFeeStrategy implements PaymentStrategy {
  process(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): LedgerEntry[] {
    return [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: STOCK_CAPITAL_ACCOUNT,
        amount: -payment.amount,
        description: payment.description,
        stock_id: payment.referenceId || undefined,
      }),
    ];
  }
}
