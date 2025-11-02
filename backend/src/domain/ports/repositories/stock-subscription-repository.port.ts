import { StockSubscription } from '../../../stock-subscriptions/entities/stock-subscription.entity';

export interface StockSubscriptionRepository {
  findById(id: string): Promise<StockSubscription | null>;
  findByMember(memberId: string): Promise<StockSubscription[]>;
  findActiveByMember(memberId: string): Promise<StockSubscription[]>;
  save(subscription: StockSubscription): Promise<StockSubscription>;
}
