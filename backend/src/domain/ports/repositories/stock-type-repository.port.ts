/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockType } from '../../entities/stock-type.entity';

export interface StockTypeRepository {
  findById(id: string): Promise<StockType | null>;
  findByCode(code: string): Promise<StockType | null>;
  findAll(): Promise<StockType[]>;
  save(stockType: StockType): Promise<StockType>;
  softDelete(id: string): Promise<void>;
}
