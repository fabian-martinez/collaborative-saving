import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class LoanPaymentStrategy implements PaymentStrategy {
  constructor(private readonly loansService: LoansService) {}

  async process(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): Promise<LedgerEntry[]> {
    return this.loansService.processLoanPayment(
      queryRunner,
      operation,
      payment,
    );
  }
}
