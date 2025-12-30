import { StockSubscription } from '../entities/stock-subscription.entity';
import { CALCULATION_CONSTANTS } from '../constants/business-rules.constants';

/**
 * Domain Service para calcular retiros de acciones usando FIFO
 * Solo contiene lógica de dominio, sin dependencias de infraestructura
 */
export class StockWithdrawalCalculator {
  /**
   * Calcula qué suscripciones y cantidades retirar según FIFO
   * Solo considera suscripciones sin préstamo de financiamiento
   *
   * @param subscriptions - Array de suscripciones disponibles
   * @param requestedQuantity - Cantidad total solicitada a retirar
   * @param stockValue - Valor unitario de la acción
   * @returns Array de objetos con subscriptionId, quantity y value retirados
   */
  calculateWithdrawalFIFO(
    subscriptions: StockSubscription[],
    requestedQuantity: number,
    stockValue: number,
  ): Array<{ subscriptionId: string; quantity: number; value: number }> {
    if (requestedQuantity <= 0) {
      return [];
    }

    if (stockValue <= 0) {
      throw new Error('Stock value must be > 0');
    }

    // 1. Filtrar solo suscripciones sin préstamo de financiamiento y con cantidad > 0
    const withdrawable = subscriptions.filter(
      (sub) => !sub.financingLoanId && sub.quantity > 0 && sub.isActive(),
    );

    // 2. Ordenar por fecha de compra (FIFO - más antiguas primero)
    withdrawable.sort(
      (a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime(),
    );

    // 3. Calcular cantidad total retirable
    const totalWithdrawable = withdrawable.reduce(
      (sum, sub) => sum + sub.quantity,
      0,
    );

    // Usar tolerancia (epsilon) para manejar errores de precisión de punto flotante
    const epsilon = CALCULATION_CONSTANTS.FLOATING_POINT_EPSILON;
    if (requestedQuantity > totalWithdrawable + epsilon) {
      throw new Error(
        `Requested quantity (${requestedQuantity}) exceeds available withdrawable quantity (${totalWithdrawable})`,
      );
    }

    // 4. Aplicar FIFO retirando la cantidad solicitada
    const withdrawals: Array<{
      subscriptionId: string;
      quantity: number;
      value: number;
    }> = [];
    let remainingToWithdraw = requestedQuantity;

    for (const subscription of withdrawable) {
      if (remainingToWithdraw <= 0) break;

      const subscriptionQuantity = subscription.quantity;
      const quantityToWithdrawFromThis = Math.min(
        subscriptionQuantity,
        remainingToWithdraw,
      );

      withdrawals.push({
        subscriptionId: subscription.id,
        quantity: quantityToWithdrawFromThis,
        value: quantityToWithdrawFromThis * stockValue,
      });

      remainingToWithdraw -= quantityToWithdrawFromThis;
    }

    return withdrawals;
  }

  /**
   * Calcula la cantidad total de acciones retirables (sin préstamo de financiamiento)
   *
   * @param subscriptions - Array de suscripciones
   * @returns Cantidad total retirable
   */
  calculateWithdrawableQuantity(subscriptions: StockSubscription[]): number {
    return subscriptions
      .filter(
        (sub) => !sub.financingLoanId && sub.quantity > 0 && sub.isActive(),
      )
      .reduce((sum, sub) => sum + sub.quantity, 0);
  }

  /**
   * Verifica si hay suficientes acciones retirables para la cantidad solicitada
   *
   * @param subscriptions - Array de suscripciones
   * @param requestedQuantity - Cantidad solicitada
   * @returns true si hay suficientes acciones retirables
   */
  hasEnoughWithdrawableQuantity(
    subscriptions: StockSubscription[],
    requestedQuantity: number,
  ): boolean {
    const withdrawableQuantity =
      this.calculateWithdrawableQuantity(subscriptions);
    // Usar tolerancia (epsilon) para manejar errores de precisión de punto flotante
    // Si la diferencia es menor a 0.0001, se considera igual
    const epsilon = 0.0001;
    return withdrawableQuantity >= requestedQuantity - epsilon;
  }
}
