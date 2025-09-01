// Chain of Responsibility para distribución de intereses y contribuciones

import { Stock } from '../../stocks/entities/stock.entity';
import { StockSubscription } from '../../stock-subscriptions/entities/stock-subscription.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';

// Contexto mínimo necesario para los handlers
export interface DistributionContext {
  totalInterest: number;
  totalStockContributions: number;
  interestAvailableForDistribution: number;
  totalRequiredGuaranteedGrowth: number;
  agilePriorityInterest: number;
  stocks: Stock[];
  subscriptions: StockSubscription[];
  ledgerEntries: LedgerEntry[];
  // Se pueden agregar más campos según necesidad
}

// Resultado parcial acumulado por la cadena
export interface DistributionResult {
  assigned: Record<string, number>; // stock_id -> monto asignado
  remaining: number;
  // Se pueden agregar más campos según necesidad
}

// Interfaz base para los handlers de la cadena
export interface DistributionHandler {
  handle(
    available: number,
    context: DistributionContext,
    partialResult: DistributionResult,
  ): { assigned: number; remaining: number; updatedResult: DistributionResult };
}
