import { Stock } from '@domain/entities/stock.entity';

export interface StockRepository {
  findById(id: string): Promise<Stock | null>;
  findByType(type: string): Promise<Stock | null>;
  findAll(): Promise<Stock[]>;
  findActive(): Promise<Stock[]>;
  save(stock: Stock): Promise<Stock>;
  findGuaranteed(): Promise<Stock[]>;
}
