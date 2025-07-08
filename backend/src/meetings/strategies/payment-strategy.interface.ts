import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';

export interface PaymentStrategy {
  process(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): Promise<LedgerEntry[]> | LedgerEntry[];
}
