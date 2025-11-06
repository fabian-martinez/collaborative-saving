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
    const regularStocks = context.stocks.filter((s) => !s.isGuaranteed);
    if (regularStocks.length === 0 || available <= 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }

    let totalValue = 0;
    const valueByStock: Record<string, number> = {};
    for (const stock of regularStocks) {
      const totalShares = context.subscriptions
        .filter((sub) => sub.stockId === stock.id)
        .reduce((sum, sub) => sum + sub.quantity, 0);
      const value = stock.value * totalShares;
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

    const assignedByStock: Record<string, number> = {};
    let totalAssigned = 0;
    for (const stock of regularStocks) {
      const value = valueByStock[stock.id] || 0;
      if (value === 0) continue;
      const assign = (value / totalValue) * available;
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
