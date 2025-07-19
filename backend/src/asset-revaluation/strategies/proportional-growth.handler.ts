import {
  DistributionHandler,
  DistributionContext,
  DistributionResult,
} from './distribution-chain';

export class ProportionalGrowthHandler implements DistributionHandler {
  handle(
    available: number,
    context: DistributionContext,
    partialResult: DistributionResult,
  ): {
    assigned: number;
    remaining: number;
    updatedResult: DistributionResult;
  } {
    // Incluir todas las acciones que NO sean garantizadas (regulares + dividendos)
    const regularStocks = context.stocks.filter((s) => !s.is_guaranteed);
    if (regularStocks.length === 0 || available <= 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }

    // Calcular el valor base: valor de la acción * número de acciones
    let totalValue = 0;
    const valueByStock: Record<string, number> = {};
    for (const stock of regularStocks) {
      const totalShares = context.subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);
      const value = Number(stock.value) * totalShares;
      valueByStock[stock.id] = value;
      totalValue += value;
    }

    if (totalValue === 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }

    // Asignar proporcionalmente según valor base
    const assignedByStock: Record<string, number> = {};
    let totalAssigned = 0;
    for (const stock of regularStocks) {
      const value = valueByStock[stock.id] || 0;
      if (value === 0) continue;
      const assign = (value / totalValue) * available;
      assignedByStock[stock.id] = assign;
      totalAssigned += assign;
    }

    // Actualizar el resultado parcial
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
