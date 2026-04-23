import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { DisbursementPlanItemDto } from '@application/dto/meetings/disbursement-plan-item.dto';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  DIVIDEND_EXPENSE_ACCOUNT,
} from '@domain/constants/account-types';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { NotFoundError } from '@domain/errors/not-found.error';
import { roundAndLimit } from '@domain/utils/round-and-limit.util';

/**
 * Process Dividend Disbursement Use Case
 *
 * Processes dividend disbursements, handling automatic approval,
 * partial disbursements, and accounting operations.
 */
export class ProcessDividendDisbursementUseCase {
  constructor(
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: {
    item: DisbursementPlanItemDto;
    meetingId: string;
    availableCash: number;
  }): Promise<number> {
    const { item, meetingId, availableCash } = dto;
    let pendingPayment: PendingMemberPayment | null = null;

    // 1. Si hay PendingMemberPayment existente, obtenerlo y aprobar si está PENDING
    if (item.pendingMemberPaymentId) {
      pendingPayment = await this.pendingMemberPaymentRepository.findById(
        item.pendingMemberPaymentId,
      );

      if (!pendingPayment) {
        throw new NotFoundError(
          'PendingMemberPayment',
          item.pendingMemberPaymentId,
        );
      }

      // Aprobar automáticamente si está PENDING
      if (pendingPayment.status === 'pending') {
        pendingPayment.approve();
        await this.pendingMemberPaymentRepository.save(pendingPayment);
      }

      // Validar que el monto no exceda el pago pendiente
      if (item.amount > pendingPayment.amount) {
        throw new BusinessRuleError(
          `El monto del desembolso (${item.amount}) excede el monto del pago pendiente (${pendingPayment.amount})`,
        );
      }
    } else {
      // Si no hay PendingMemberPayment, crear uno nuevo
      pendingPayment = PendingMemberPayment.create({
        memberId: item.memberId,
        meetingId,
        type: PendingMemberPaymentType.DIVIDEND,
        amount: item.amount,
        notes: item.notes || 'Dividendo',
      });
      pendingPayment.approve(); // Aprobar automáticamente
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    }

    // 2. Calcular monto máximo desembolsable
    const maxDisbursable = Math.min(
      item.amount,
      availableCash,
      pendingPayment.amount,
    );

    if (maxDisbursable <= 0) {
      throw new BusinessRuleError(
        'No hay efectivo disponible para desembolsar este dividendo',
      );
    }

    // 3. Registrar operación contable por monto desembolsado
    await this.recordOperationUseCase.execute({
      memberId: item.memberId,
      meetingId,
      type: OperationType.DIVIDEND_PAYMENT,
      description: item.notes || `Entrega de dividendos - ${maxDisbursable}`,
      date: new Date(),
      entries: this.createDividendLedgerEntries(maxDisbursable),
    });

    // 4. Manejar PendingMemberPayment según sea completo o parcial
    if (maxDisbursable >= pendingPayment.amount) {
      // Dividendo completo: marcar como PAID
      pendingPayment.markAsPaid();
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    } else {
      // Dividendo parcial: marcar original como PAID y crear nuevo por faltante
      const remainingAmount = roundAndLimit(
        pendingPayment.amount - maxDisbursable,
        9999999999.99,
        2,
      );

      pendingPayment.markAsPaid();
      await this.pendingMemberPaymentRepository.save(pendingPayment);

      // Crear nuevo PendingMemberPayment por faltante
      if (remainingAmount > 0) {
        const newPendingPayment = PendingMemberPayment.create({
          memberId: item.memberId,
          meetingId,
          type: PendingMemberPaymentType.DIVIDEND,
          amount: remainingAmount,
          notes: `Saldo pendiente de dividendo - ${item.notes || ''}`.trim(),
        });
        newPendingPayment.approve(); // Aprobar automáticamente
        await this.pendingMemberPaymentRepository.save(newPendingPayment);
      }
    }

    return maxDisbursable;
  }

  private createDividendLedgerEntries(
    amount: number,
  ): Array<RecordOperationDto['entries'][0]> {
    return [
      {
        accountType: CASH_ACCOUNT,
        amount: -amount, // Crédito: disminución de efectivo
        description: 'Entrega de dividendos',
      },
      {
        accountType: DIVIDEND_EXPENSE_ACCOUNT,
        amount: amount, // Débito: gasto en dividendos
        description: 'Entrega de dividendos',
      },
    ];
  }
}
