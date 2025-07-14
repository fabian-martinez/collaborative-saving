import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { StocksService } from '../../stocks/stocks.service';
import { DisbursementPlanItemDto } from '../dto/disbursement-plan.dto';

@Injectable()
export class StockWithdrawalStrategy implements DisbursementStrategy {
  constructor(private readonly stocksService: StocksService) {}

  async execute({
    queryRunner,
    meetingId,
    item,
  }: {
    queryRunner: import('typeorm').QueryRunner;
    meetingId: string;
    item: DisbursementPlanItemDto;
  }): Promise<void> {
    // 1. Buscar suscripciones libres de crédito del socio para ese stockId
    const stockId = item.disbursementStockRequest?.stockId;
    if (!stockId) {
      throw new Error('No se proporcionó stockId para el retiro de acciones');
    }
    const subscriptions =
      await this.stocksService.getStockSubscriptionByMemberAndStock({
        stockId,
        memberId: item.memberId,
      });
    const withdrawable = subscriptions.filter(
      (sub) => sub.financing_loan_id === null && Number(sub.quantity) > 0,
    );
    // 2. Ordenar por fecha de compra (FIFO)
    withdrawable.sort(
      (a, b) =>
        new Date(a.purchase_date).getTime() -
        new Date(b.purchase_date).getTime(),
    );
    const stock = await this.stocksService.findOne(stockId);
    if (!stock || !stock.value) {
      throw new Error('No se encontró el stock o su valor es inválido');
    }
    let quantityToWithdraw = item.amount / stock.value;
    for (const sub of withdrawable) {
      if (quantityToWithdraw <= 0) break;
      const subQty = Number(sub.quantity);
      if (subQty <= quantityToWithdraw) {
        // Dejar la suscripción en 0
        await queryRunner.manager.update(
          sub.constructor,
          { id: sub.id },
          { quantity: 0 },
        );
        quantityToWithdraw -= subQty;
      } else {
        // Descontar solo lo necesario
        await queryRunner.manager.update(
          sub.constructor,
          { id: sub.id },
          { quantity: subQty - quantityToWithdraw },
        );
        quantityToWithdraw = 0;
      }
    }
    // 3. Registrar operación y asientos contables
    const operation = queryRunner.manager.create(Operation, {
      member_id: item.memberId,
      meeting_id: meetingId,
      description: `Retiro de acciones (${item.disbursementStockRequest?.stockId})`,
      type: 'STOCK_WITHDRAWAL',
    });
    await queryRunner.manager.save(operation);
    const ledgerEntries: LedgerEntry[] = [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        stock_id: item.disbursementStockRequest?.stockId,
        account_type: 'STOCK_CAPITAL_ACCOUNT',
        amount: item.amount,
        description: 'Retiro de acciones',
      }),
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: 'CASH_ACCOUNT',
        amount: -item.amount,
        description: 'Entrega de efectivo por retiro de acciones',
      }),
    ];
    await queryRunner.manager.save(ledgerEntries);
  }
}
