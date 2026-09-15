/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockBehavior } from '@domain/enums/stock-behavior.enum';

export interface UpdateStockTypeDto {
  name?: string;
  behavior?: StockBehavior;
  isGuaranteed?: boolean;
  guaranteedYield?: number | null;
  description?: string | null;
}
