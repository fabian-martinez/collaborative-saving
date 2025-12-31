import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { DisbursementPlanItemDto } from '@application/dto/meetings/disbursement-plan-item.dto';
import { StockWithdrawalCalculator } from '@domain/services/stock-withdrawal-calculator.service';
import {
  StockSubscription,
  StockSubscriptionStatus,
} from '@domain/entities/stock-subscription.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '@domain/constants/account-types';
import { CALCULATION_CONSTANTS } from '@domain/constants/business-rules.constants';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { NotFoundError } from '@domain/errors/not-found.error';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

/**
 * Process Stock Withdrawal Disbursement Use Case
 *
 * Processes stock withdrawal disbursements using FIFO logic.
 * Handles partial disbursements due to insufficient cash and creates
 * PendingMemberPayment for remaining amounts.
 */
export class ProcessStockWithdrawalDisbursementUseCase {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly stockWithdrawalCalculator: StockWithdrawalCalculator,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: {
    item: DisbursementPlanItemDto;
    meetingId: string;
    availableCash: number;
  }): Promise<void> {
    const { item, meetingId, availableCash } = dto;

    // 1. Validar que hay stockId para el retiro
    const stockId = item.disbursementStockRequest?.stockId;
    if (!stockId) {
      throw new InvalidRequestError(
        'Debe proporcionar stockId para retiro de acciones',
      );
    }

    // 2. Obtener stock
    const stock = await this.stockRepository.findById(stockId);
    if (!stock) {
      throw new StockNotFoundException(stockId);
    }

    // 3. Calcular cantidad total a retirar (solicitada)
    const requestedAmount = item.amount;
    const stockValue = stock.value;
    if (stockValue <= 0) {
      throw new BusinessRuleError('El valor de la acción debe ser > 0');
    }

    // Redondear a 10 decimales para evitar problemas de precisión de punto flotante
    const requestedQuantity =
      Math.round(
        (requestedAmount / stockValue) *
          CALCULATION_CONSTANTS.FLOATING_POINT_PRECISION,
      ) / CALCULATION_CONSTANTS.FLOATING_POINT_PRECISION;

    // 4. Obtener suscripciones del socio para este stock
    const allSubscriptions =
      await this.stockSubscriptionRepository.findByStock(stockId);
    const memberSubscriptions = allSubscriptions.filter(
      (sub) => sub.memberId === item.memberId,
    );

    // 5. Validar que hay suficientes acciones retirables
    const hasEnough =
      this.stockWithdrawalCalculator.hasEnoughWithdrawableQuantity(
        memberSubscriptions,
        requestedQuantity,
      );

    if (!hasEnough) {
      const withdrawableQuantity =
        this.stockWithdrawalCalculator.calculateWithdrawableQuantity(
          memberSubscriptions,
        );
      throw new BusinessRuleError(
        `Cantidad solicitada (${requestedQuantity}) excede acciones disponibles sin préstamo (${withdrawableQuantity})`,
      );
    }

    // 6. Calcular monto máximo desembolsable
    const maxDisbursable = Math.min(requestedAmount, availableCash);

    // 7. Usar StockWithdrawalCalculator para calcular retiros FIFO
    // Retirar cantidad completa solicitada (aunque no haya efectivo suficiente)
    const withdrawals = this.stockWithdrawalCalculator.calculateWithdrawalFIFO(
      memberSubscriptions,
      requestedQuantity,
      stockValue,
    );

    // 8. Actualizar suscripciones reduciendo cantidades completas
    const subscriptionsToUpdate: StockSubscription[] = [];
    for (const withdrawal of withdrawals) {
      const subscription = memberSubscriptions.find(
        (s) => s.id === withdrawal.subscriptionId,
      );
      if (!subscription) {
        throw new NotFoundError('StockSubscription', withdrawal.subscriptionId);
      }

      const newQuantity = subscription.quantity - withdrawal.quantity;
      subscription.update({
        quantity: newQuantity,
        status:
          newQuantity === 0
            ? StockSubscriptionStatus.INACTIVE
            : StockSubscriptionStatus.ACTIVE,
      });
      subscriptionsToUpdate.push(subscription);
    }

    // Guardar todas las suscripciones actualizadas
    await this.stockSubscriptionRepository.saveMany(subscriptionsToUpdate);

    // 9. Si hay monto a desembolsar, registrar operación contable
    if (maxDisbursable > 0) {
      await this.recordOperationUseCase.execute({
        memberId: item.memberId,
        meetingId,
        type: OperationType.STOCK_WITHDRAWAL,
        description: item.notes || `Retiro de acciones ${stock.type}`,
        date: new Date(),
        entries: this.createWithdrawalLedgerEntries(stock.id, maxDisbursable),
      });
    }

    // 10. Manejar PendingMemberPayment existente si existe
    let pendingPayment: PendingMemberPayment | null = null;
    if (item.pendingMemberPaymentId) {
      pendingPayment = await this.pendingMemberPaymentRepository.findById(
        item.pendingMemberPaymentId,
      );
      if (pendingPayment) {
        // Aprobar automáticamente si está PENDING
        if (pendingPayment.status === 'pending') {
          pendingPayment.approve();
          await this.pendingMemberPaymentRepository.save(pendingPayment);
        }
      }
    }

    // 11. Calcular saldo pendiente y crear PendingMemberPayment si es necesario
    const remainingAmount = requestedAmount - maxDisbursable;

    if (remainingAmount > 0) {
      // Hay saldo pendiente: crear PendingMemberPayment
      // Si había uno existente, marcarlo como PAID y crear nuevo por faltante
      if (pendingPayment) {
        pendingPayment.markAsPaid();
        await this.pendingMemberPaymentRepository.save(pendingPayment);
      }

      // Crear nuevo PendingMemberPayment por saldo pendiente
      // El saldo pendiente representa dinero que el fondo debe al socio
      // y debe participar en revalorización
      const newPendingPayment = PendingMemberPayment.create({
        memberId: item.memberId,
        meetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: remainingAmount,
        stockId: stock.id,
        stockSubscriptionId:
          withdrawals[0]?.subscriptionId ||
          item.stockSubscriptionId ||
          undefined,
        notes:
          `Saldo pendiente por retiro de ${requestedQuantity} acciones ${stock.type} - ${item.notes || ''}`.trim(),
      });
      newPendingPayment.approve(); // Aprobar automáticamente
      await this.pendingMemberPaymentRepository.save(newPendingPayment);
    } else if (pendingPayment) {
      // No hay saldo pendiente: marcar como PAID
      pendingPayment.markAsPaid();
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    }
  }

  private createWithdrawalLedgerEntries(
    stockId: string,
    amount: number,
  ): Array<RecordOperationDto['entries'][0]> {
    return [
      {
        accountType: CASH_ACCOUNT,
        amount: -amount, // Crédito: disminución de efectivo
        description: `Retiro de acciones`,
        stockId: stockId,
      },
      {
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: amount, // Débito: disminución de capital
        description: `Retiro de acciones`,
        stockId: stockId,
      },
    ];
  }
}
