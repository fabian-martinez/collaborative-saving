import { StockValueHistory } from '../../entities/stock-value-history.entity';

export interface StockValueHistoryRepository {
  findById(id: string): Promise<StockValueHistory | null>;
  findByStock(stockId: string): Promise<StockValueHistory[]>;
  findLatestByStock(stockId: string): Promise<StockValueHistory | null>;
  findByStockBeforeDate(
    stockId: string,
    date: Date,
  ): Promise<StockValueHistory | null>;
  save(history: StockValueHistory): Promise<StockValueHistory>;
  saveMany(histories: StockValueHistory[]): Promise<StockValueHistory[]>;
}
