import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { INSURANCE_INCOME_ACCOUNT } from '../../common/constants/account-types';

@Injectable()
export class InsuranceStrategy implements PaymentStrategy {
  process(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): LedgerEntry[] {
    return [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: INSURANCE_INCOME_ACCOUNT,
        amount: -payment.amount,
        description: payment.description,
      }),
    ];
  }
}
