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

    let availableFromAgilePriority = context.agilePriorityInterest;
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

    let totalAssigned = 0;
    const assignedByStock: Record<string, number> = {};

    // First pass: Process CDT stocks
    const cdtStocks = guaranteedStocks.filter((s) => s.type.startsWith('CDT-'));
    for (const stock of cdtStocks) {
      const required = requiredByStock[stock.id] || 0;
      if (required === 0) continue;

      let assign = 0;
      if (availableFromAgilePriority >= required) {
        assign = required;
      } else {
        assign = availableFromAgilePriority;
      }

      assign = Math.max(assign, 0);
      assignedByStock[stock.id] = assign;
      totalAssigned += assign;
      availableFromAgilePriority -= assign;
    }

    // Second pass: Process other guaranteed stocks (proportional if not enough)
    const otherGuaranteedStocks = guaranteedStocks.filter(
      (s) => !s.type.startsWith('CDT-'),
    );
    const otherTotalRequired = otherGuaranteedStocks.reduce(
      (sum, stock) => sum + (requiredByStock[stock.id] || 0),
      0,
    );

    if (otherTotalRequired > 0 && availableFromAgilePriority > 0) {
      for (const stock of otherGuaranteedStocks) {
        const required = requiredByStock[stock.id] || 0;
        if (required === 0) continue;

        let assign = 0;
        if (availableFromAgilePriority >= otherTotalRequired) {
          assign = required;
        } else {
          assign = (required / otherTotalRequired) * availableFromAgilePriority;
        }

        assign = Math.max(assign, 0);
        assignedByStock[stock.id] = assign;
        totalAssigned += assign;
      }
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
