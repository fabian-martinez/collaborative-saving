import { StockBehavior } from '@domain/entities/stock.entity';

export class UpdateStockDto {
  type?: string;
  value?: number;
  monthlyContribution?: number;
  isGuaranteed?: boolean;
  guaranteedYield?: number | null;
  behavior?: StockBehavior;
}
