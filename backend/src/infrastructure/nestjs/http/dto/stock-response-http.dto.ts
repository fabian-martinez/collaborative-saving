import { StockBehavior } from '@domain/entities/stock.entity';

export class StockResponseHttpDto {
  id: string;
  type: string;
  value: number;
  monthly_contribution: number;
  is_guaranteed: boolean;
  guaranteed_yield: number | null;
  behavior: StockBehavior;
  created_at: Date;
}
