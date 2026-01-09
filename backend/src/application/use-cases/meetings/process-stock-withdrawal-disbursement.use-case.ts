import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { DisbursementPlanItemDto } from '@application/dto/meetings/disbursement-plan-item.dto';
import { StockWithdrawalCalculator } from '@domain/services/stock-withdrawal-calculator.service';
import { Stock } from '@domain/entities/stock.entity';
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

    // CASO 1: Si hay pendingMemberPaymentId, es un pago pendiente (valor en efectivo)
    // NO modificar suscripciones, solo desembolsar efectivo
    if (item.pendingMemberPaymentId) {
      return this.processPendingPaymentDisbursement(
        item,
        meetingId,
        availableCash,
        stock,
      );
    }

    // CASO 2: Retiro real de acciones - SÍ modificar suscripciones
    return this.processStockWithdrawal(item, meetingId, availableCash, stock);
  }

  /**
   * Procesa un pago pendiente de retiro de acciones.
   * NO modifica suscripciones, solo desembolsa efectivo.
   */
  private async processPendingPaymentDisbursement(
    item: DisbursementPlanItemDto,
    meetingId: string,
    availableCash: number,
    stock: Stock,
  ): Promise<void> {
    // 1. Obtener el pending payment
    const pendingPayment = await this.pendingMemberPaymentRepository.findById(
      item.pendingMemberPaymentId!,
    );
    if (!pendingPayment) {
      throw new NotFoundError(
        'PendingMemberPayment',
        item.pendingMemberPaymentId!,
      );
    }

    // 2. Aprobar el pending payment si está pendiente
    if (pendingPayment.status === 'pending') {
      pendingPayment.approve();
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    }

    // 3. Validar que el monto del item no exceda el del pending payment
    if (item.amount > pendingPayment.amount) {
      throw new BusinessRuleError(
        `El monto del desembolso (${item.amount}) excede el monto del pago pendiente (${pendingPayment.amount})`,
      );
    }

    // 4. Calcular monto máximo desembolsable (basado en pendingPayment.amount, no item.amount)
    const maxDisbursable = Math.min(
      item.amount,
      availableCash,
      pendingPayment.amount,
    );

    if (maxDisbursable <= 0) {
      throw new BusinessRuleError(
        'No hay efectivo disponible para desembolsar este pago pendiente',
      );
    }

    // 5. Si hay monto a desembolsar, registrar operación contable
    if (maxDisbursable > 0) {
      await this.recordOperationUseCase.execute({
        memberId: item.memberId,
        meetingId,
        type: OperationType.STOCK_WITHDRAWAL,
        description:
          item.notes || `Pago pendiente de retiro de acciones ${stock.type}`,
        date: new Date(),
        entries: this.createWithdrawalLedgerEntries(stock.id, maxDisbursable),
      });
    }

    // 6. Calcular saldo pendiente basado en pendingPayment.amount, no item.amount
    const remainingAmount = pendingPayment.amount - maxDisbursable;

    if (remainingAmount > 0) {
      // Hay saldo pendiente: marcar el existente como PAID y crear nuevo por faltante
      pendingPayment.markAsPaid();
      await this.pendingMemberPaymentRepository.save(pendingPayment);

      const newPendingPayment = PendingMemberPayment.create({
        memberId: item.memberId,
        meetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: remainingAmount,
        stockId: stock.id,
        stockSubscriptionId:
          pendingPayment.stockSubscriptionId ||
          item.stockSubscriptionId ||
          undefined,
        notes: `Saldo pendiente de pago de retiro de acciones - ${
          item.notes || ''
        }`.trim(),
      });
      // El pago pendiente se crea con estado PENDING por defecto
      await this.pendingMemberPaymentRepository.save(newPendingPayment);
    } else {
      // No hay saldo pendiente: marcar como PAID
      pendingPayment.markAsPaid();
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    }
  }

  /**
   * Procesa un retiro real de acciones.
   * SÍ modifica suscripciones reduciendo cantidades.
   */
  private async processStockWithdrawal(
    item: DisbursementPlanItemDto,
    meetingId: string,
    availableCash: number,
    stock: Stock,
  ): Promise<void> {
    const stockValue = stock.value;
    if (stockValue <= 0) {
      throw new BusinessRuleError('El valor de la acción debe ser > 0');
    }

    // Si hay stockWithdrawalQuantity, usarlo para calcular el monto total solicitado
    // De lo contrario, usar item.amount (para compatibilidad con retiros sin cantidad específica)
    const requestedAmount = item.disbursementStockRequest
      ?.stockWithdrawalQuantity
      ? item.disbursementStockRequest.stockWithdrawalQuantity * stockValue
      : item.amount;

    // Redondear a 10 decimales para evitar problemas de precisión de punto flotante
    const requestedQuantity =
      Math.round(
        (requestedAmount / stockValue) *
          CALCULATION_CONSTANTS.FLOATING_POINT_PRECISION,
      ) / CALCULATION_CONSTANTS.FLOATING_POINT_PRECISION;

    // 1. Obtener suscripciones del socio para este stock
    const allSubscriptions = await this.stockSubscriptionRepository.findByStock(
      stock.id,
    );
    const memberSubscriptions = allSubscriptions.filter(
      (sub) => sub.memberId === item.memberId,
    );

    // Si hay un stockSubscriptionId específico en el item, solo verificar que existe y pertenece al miembro
    // (es solo una referencia, no restringe el retiro a esa suscripción específica)
    if (item.stockSubscriptionId) {
      const specificSubscription = memberSubscriptions.find(
        (sub) => sub.id === item.stockSubscriptionId,
      );
      if (!specificSubscription) {
        throw new NotFoundError('StockSubscription', item.stockSubscriptionId);
      }
    }

    // 2. Validar que hay suficientes acciones retirables
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

    // 3. Validar que hay suficiente efectivo disponible para el desembolso solicitado
    // Cuando hay stockWithdrawalQuantity, item.amount es el monto exacto que se quiere desembolsar
    if (item.disbursementStockRequest?.stockWithdrawalQuantity) {
      if (item.amount > availableCash) {
        throw new BusinessRuleError(
          `No hay suficiente efectivo disponible para desembolsar el monto solicitado. Solicitado: ${item.amount}, Disponible: ${availableCash}`,
        );
      }
    }

    // 4. Calcular monto máximo desembolsable
    // Si hay stockWithdrawalQuantity, item.amount representa cuánto desembolsar en esta reunión
    // Debe respetarse como límite máximo, además del availableCash
    const maxDisbursable = Math.min(
      item.amount, // Lo que el usuario quiere desembolsar en esta reunión
      availableCash, // Lo que hay disponible
      requestedAmount, // El monto total del retiro (para validación)
    );

    // 5. Usar StockWithdrawalCalculator para calcular retiros FIFO
    // Retirar cantidad completa solicitada (aunque no haya efectivo suficiente)
    const withdrawals = this.stockWithdrawalCalculator.calculateWithdrawalFIFO(
      memberSubscriptions,
      requestedQuantity,
      stockValue,
    );

    // 6. Actualizar suscripciones reduciendo cantidades completas
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

    // 7. Si hay monto a desembolsar, registrar operación contable
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

    // 8. Calcular saldo pendiente y crear PendingMemberPayment si es necesario
    const remainingAmount = requestedAmount - maxDisbursable;

    if (remainingAmount > 0) {
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
      // El pago pendiente se crea con estado PENDING por defecto
      await this.pendingMemberPaymentRepository.save(newPendingPayment);
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
