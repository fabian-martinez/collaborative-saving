import { StockBehavior } from '@domain/entities/stock.entity';

export class CreateStockDto {
  type: string;
  value: number;
  monthlyContribution: number;
  isGuaranteed?: boolean;
  guaranteedYield?: number | null;
  behavior?: StockBehavior;
}
