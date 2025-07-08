import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import {
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '../../common/constants/account-types';
import { LoansService } from '../../loans/loans.service';
import { LoanTransactionDetail } from '../../loans/entities/loan-transaction-detail.entity';

@Injectable()
export class LoanPaymentStrategy implements PaymentStrategy {
  constructor(private readonly loansService: LoansService) {}

  async process(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): Promise<LedgerEntry[]> {
    if (!payment.referenceId) {
      throw new BadRequestException('Loan payment must include a referenceId.');
    }

    const loan = await this.loansService.findOne(payment.referenceId);
    const interestDue = loan.outstanding_balance * loan.interest_rate;
    const interestPaid = Math.min(payment.amount, interestDue);
    const principalPaid = payment.amount - interestPaid;

    const ledgerEntries: LedgerEntry[] = [];

    if (interestPaid > 0) {
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          account_type: INTEREST_INCOME_ACCOUNT,
          amount: -interestPaid,
          description: payment.description,
        }),
      );
      const interestTransaction = queryRunner.manager.create(
        LoanTransactionDetail,
        {
          loan_id: loan.id,
          operation_id: operation.id,
          transaction_type: 'pago_interes',
          amount: interestPaid,
        },
      );
      await queryRunner.manager.save(interestTransaction);
    }

    if (principalPaid > 0) {
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          account_type: LOANS_RECEIVABLE_ACCOUNT,
          amount: -principalPaid,
          description: payment.description,
        }),
      );
      const principalTransaction = queryRunner.manager.create(
        LoanTransactionDetail,
        {
          loan_id: loan.id,
          operation_id: operation.id,
          transaction_type: 'abono_capital',
          amount: principalPaid,
        },
      );
      await queryRunner.manager.save(principalTransaction);
    }

    return ledgerEntries;
  }
}
