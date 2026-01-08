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
    const guaranteedStocks = context.stocks.filter((s) => s.isGuaranteed);
    if (guaranteedStocks.length === 0 || available <= 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }

    const availableFromAgilePriority = context.agilePriorityInterest;
    let totalRequired = 0;
    const requiredByStock: Record<string, number> = {};
    for (const stock of guaranteedStocks) {
      const totalShares = context.subscriptions
        .filter((sub) => sub.stockId === stock.id && sub.isActive())
        .reduce((sum, sub) => sum + sub.quantity, 0);
      if (totalShares === 0) continue;
      const requiredGrowth =
        stock.value * (stock.guaranteedYield || 0) * totalShares;
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

    const assignedByStock: Record<string, number> = {};
    let totalAssigned = 0;
    for (const stock of guaranteedStocks) {
      const required = requiredByStock[stock.id] || 0;
      if (required === 0) continue;

      let assign = 0;
      if (availableFromAgilePriority >= totalRequired) {
        assign = required;
      } else {
        assign = (required / totalRequired) * availableFromAgilePriority;
      }

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
