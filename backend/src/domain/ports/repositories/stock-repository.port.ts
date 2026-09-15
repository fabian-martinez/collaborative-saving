/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Stock } from '@domain/entities/stock.entity';

export interface StockRepository {
  findById(id: string): Promise<Stock | null>;
  findByIds(ids: string[]): Promise<Stock[]>;
  findByName(name: string): Promise<Stock | null>;
  findByType(type: string): Promise<Stock | null>;
  findAll(): Promise<Stock[]>;
  findActive(): Promise<Stock[]>;
  save(stock: Stock): Promise<Stock>;
  saveMany(stocks: Stock[]): Promise<Stock[]>;

  findGuaranteed(): Promise<Stock[]>;
  hasActiveStocksByType?(stockType: string): Promise<boolean>;
  softDelete?(id: string): Promise<void>;
}
