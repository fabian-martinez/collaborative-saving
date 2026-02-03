import { StockType } from '../../entities/stock-type.entity';

export interface StockTypeRepository {
  findAll(): Promise<StockType[]>;
  findById(id: string): Promise<StockType | null>;
  findByStockId(stockId: string): Promise<StockType | null>;
  save(stockType: StockType): Promise<StockType>;
  delete(id: string): Promise<void>;
}
