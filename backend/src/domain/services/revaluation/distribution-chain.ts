import { Stock } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { StockType } from '@domain/entities/stock-type.entity';

export interface DistributionContext {
  totalInterest: number;
  totalStockContributions: number;
  interestAvailableForDistribution: number;
  totalRequiredGuaranteedGrowth: number;
  interestByStock: Record<string, number>; // Mapping of pre-allocated interest for specific stocks
  stocks: Stock[];
  stockTypes: StockType[];
  subscriptions: StockSubscription[];
  ledgerEntries: LedgerEntry[];
}

export interface DistributionResult {
  assigned: Record<string, number>; // stock_id -> monto asignado
  remaining: number;
}

export interface DistributionHandler {
  handle(
    available: number,
    context: DistributionContext,
    partialResult: DistributionResult,
  ): { assigned: number; remaining: number; updatedResult: DistributionResult };
}
