import { StockBehavior } from '@domain/entities/stock.entity';

export class StockResponseDto {
  id: string;
  name: string;
  value: number;
  monthlyContribution: number;
  isGuaranteed: boolean;
  guaranteedYield: number | null;
  createdAt: Date;
}
