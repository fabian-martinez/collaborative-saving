import { StockSubscription } from '../../entities/stock-subscription.entity';

export interface StockSubscriptionRepository {
  findById(id: string): Promise<StockSubscription | null>;
  findByMemberAndStock(
    memberId: string,
    stockId: string,
  ): Promise<StockSubscription | null>;
  findByMember(memberId: string): Promise<StockSubscription[]>;
  findActiveByMember(memberId: string): Promise<StockSubscription[]>;
  findFreeOfFinancing(memberId: string): Promise<StockSubscription[]>;
  save(stockSubscription: StockSubscription): Promise<StockSubscription>;
  saveMany(
    stockSubscriptions: StockSubscription[],
  ): Promise<StockSubscription[]>;
  findByStock(stockId: string): Promise<StockSubscription[]>;
}
