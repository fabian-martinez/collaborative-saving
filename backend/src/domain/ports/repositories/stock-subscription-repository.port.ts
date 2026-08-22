import { StockSubscription } from '../../entities/stock-subscription.entity';

export interface StockSubscriptionRepository {
  findById(id: string): Promise<StockSubscription | null>;
  findByIds(ids: string[]): Promise<StockSubscription[]>;
  findByMemberAndStock(
    memberId: string,
    stockId: string,
  ): Promise<StockSubscription | null>;
  findAllByMemberAndStock(
    memberId: string,
    stockId: string,
  ): Promise<StockSubscription[]>;
  findByMember(memberId: string): Promise<StockSubscription[]>;
  findActiveByMember(memberId: string): Promise<StockSubscription[]>;
  findFreeOfFinancing(memberId: string): Promise<StockSubscription[]>;
  findByMemberAndStockAndNoLoan(
    memberId: string,
    stockId: string,
  ): Promise<StockSubscription | null>;
  findByFinancingLoan(financingLoanId: string): Promise<StockSubscription[]>;
  save(stockSubscription: StockSubscription): Promise<StockSubscription>;
  saveMany(
    stockSubscriptions: StockSubscription[],
  ): Promise<StockSubscription[]>;
  findByStock(stockId: string): Promise<StockSubscription[]>;
  findByStocks(stockIds: string[]): Promise<StockSubscription[]>;
}
