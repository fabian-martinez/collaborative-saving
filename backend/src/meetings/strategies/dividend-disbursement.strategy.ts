import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { DisbursementPlanItemDto } from '../dto/disbursement-plan.dto';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';

@Injectable()
export class DividendDisbursementStrategy implements DisbursementStrategy {
  async execute({
    queryRunner,
    meetingId,
    item,
  }: {
    queryRunner: import('typeorm').QueryRunner;
    meetingId: string;
    item: DisbursementPlanItemDto;
  }): Promise<void> {
    if (!item.memberId)
      throw new Error(
        'Debe asignar un miembro para el desembolso de dividendo.',
      );
    const description = item.notes || 'Entrega de dividendos';
    // 1. Registrar operación
    const operation = queryRunner.manager.create(Operation, {
      member_id: item.memberId,
      meeting_id: meetingId,
      description,
      type: 'DIVIDEND_PAYMENT',
    });
    await queryRunner.manager.save(operation);
    // 2. Registrar asientos contables (salida de efectivo y gasto de dividendos)
    const ledgerEntries: LedgerEntry[] = [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: 'CASH_ACCOUNT',
        amount: -item.amount,
        description,
      }),
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: 'DIVIDEND_EXPENSE_ACCOUNT',
        amount: item.amount,
        description,
      }),
    ];
    await queryRunner.manager.save(ledgerEntries);
  }
}
