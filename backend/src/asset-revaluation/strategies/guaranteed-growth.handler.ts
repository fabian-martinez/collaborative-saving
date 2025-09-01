import {
  DistributionHandler,
  DistributionContext,
  DistributionResult,
} from './distribution-chain';

export class GuaranteedGrowthHandler implements DistributionHandler {
  handle(
    available: number,
    context: DistributionContext,
    partialResult: DistributionResult,
  ): {
    assigned: number;
    remaining: number;
    updatedResult: DistributionResult;
  } {
    // Solo acciones garantizadas, proporcional a valor*acciones
    const guaranteedStocks = context.stocks.filter((s) => s.is_guaranteed);
    if (guaranteedStocks.length === 0 || available <= 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }

    // Usar los intereses de préstamos ágiles y prioritarios para el cálculo
    const availableFromAgilePriority = context.agilePriorityInterest;
    // Calcular el total requerido para cubrir el crecimiento garantizado (valor*yield*acciones)
    let totalRequired = 0;
    const requiredByStock: Record<string, number> = {};
    for (const stock of guaranteedStocks) {
      const totalShares = context.subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);
      if (totalShares === 0) continue;
      const requiredGrowth =
        Number(stock.value) * Number(stock.guaranteed_yield) * totalShares;
      requiredByStock[stock.id] = requiredGrowth;
      totalRequired += requiredGrowth;
    }

    if (totalRequired === 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }

    // Usar intereses de préstamos ágiles y prioritarios como límite
    // Si los intereses ágiles/prioritarios >= requerido → usar requerido
    // Si los intereses ágiles/prioritarios < requerido → usar solo los intereses ágiles/prioritarios
    const assignedByStock: Record<string, number> = {};
    let totalAssigned = 0;
    for (const stock of guaranteedStocks) {
      const required = requiredByStock[stock.id] || 0;
      if (required === 0) continue;

      let assign = 0;
      if (availableFromAgilePriority >= totalRequired) {
        // Los intereses ágiles/prioritarios cubren todo lo requerido → usar el requerido completo
        assign = required;
      } else {
        // Los intereses ágiles/prioritarios no cubren todo → usar proporcionalmente de los ágiles/prioritarios
        assign = (required / totalRequired) * availableFromAgilePriority;
      }

      // Nunca asignar menos de cero
      assign = Math.max(assign, 0);
      assignedByStock[stock.id] = assign;
      totalAssigned += assign;
    }

    const updatedResult: DistributionResult = {
      ...partialResult,
      assigned: {
        ...partialResult.assigned,
        ...assignedByStock,
      },
      remaining: available - totalAssigned,
    };

    return {
      assigned: totalAssigned,
      remaining: available - totalAssigned,
      updatedResult,
    };
  }
}
