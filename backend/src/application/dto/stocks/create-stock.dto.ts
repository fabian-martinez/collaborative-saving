import { StockBehavior } from '@domain/entities/stock.entity';

export class CreateStockDto {
  name: string;
  value: number;
  monthlyContribution: number;
  isGuaranteed?: boolean;
  guaranteedYield?: number | null;
  stockTypeId?: string | null;
}
