import { StockBehavior } from '../../stocks/entities/stock.entity';
import {
  DistributionHandler,
  DistributionContext,
  DistributionResult,
} from './distribution-chain';

export class DividendYieldStockGrowthHandler implements DistributionHandler {
  handle(
    available: number,
    context: DistributionContext,
    partialResult: DistributionResult,
  ): {
    assigned: number;
    remaining: number;
    updatedResult: DistributionResult;
  } {
    const dividendStocks = context.stocks.filter(
      (s) => s.behavior === StockBehavior.DIVIDEND_YIELD,
    );
    if (dividendStocks.length === 0 || available <= 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }
    // Calcular el valor total de las acciones dividend yield
    let totalValue = 0;
    const valueByStock: Record<string, number> = {};
    for (const stock of dividendStocks) {
      const totalShares = context.subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);
      const value = Number(stock.value) * totalShares;
      valueByStock[stock.id] = value;
      totalValue += value;
    }
    console.log('[DividendYieldStockGrowthHandler]');
    console.log('  available:', available);
    console.log('  valueByStock:', valueByStock);
    console.log('  totalValue:', totalValue);
    if (totalValue === 0) {
      return {
        assigned: 0,
        remaining: available,
        updatedResult: partialResult,
      };
    }
    // Asignar proporcionalmente según el valor de cada acción
    const assignedByStock: Record<string, number> = {};
    let totalAssigned = 0;
    for (const stock of dividendStocks) {
      const value = valueByStock[stock.id] || 0;
      if (value === 0) continue;
      const assign = (value / totalValue) * available;
      assignedByStock[stock.id] = assign;
      totalAssigned += assign;
    }
    console.log('  totalAssigned:', totalAssigned);
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
