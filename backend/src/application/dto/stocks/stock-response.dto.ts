import { StockBehavior } from '@domain/entities/stock.entity';

export class StockResponseDto {
  id: string;
  type: string;
  value: number;
  monthlyContribution: number;
  isGuaranteed: boolean;
  guaranteedYield: number | null;
  behavior: StockBehavior;
  createdAt: Date;
}
