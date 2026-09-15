/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockBehavior } from '@domain/entities/stock.entity';

export class StockResponseDto {
  id: string;
  name: string;
  type: string;
  stockTypeId?: string | null;
  value: number;
  monthlyContribution: number;
  isGuaranteed: boolean;
  guaranteedYield: number | null;
  behavior: StockBehavior;
  createdAt: Date;
}
