import { Stock } from '@domain/entities/stock.entity';

export interface StockRepository {
  findById(id: string): Promise<Stock | null>;
  findByIds(ids: string[]): Promise<Stock[]>;
  findByType(type: string): Promise<Stock | null>;
  findAll(): Promise<Stock[]>;
  findActive(): Promise<Stock[]>;
  save(stock: Stock): Promise<Stock>;
  saveMany(stocks: Stock[]): Promise<Stock[]>;
  findByIds(ids: string[]): Promise<Stock[]>;
  findGuaranteed(): Promise<Stock[]>;
}
