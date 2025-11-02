import { StockSubscription as StockSubscriptionDomain } from '@domain/entities/stock-subscription.entity';
import { StockSubscription as StockSubscriptionEntity } from '../entities/stock-subscription.entity';

export class StockSubscriptionMapper {
  static toDomain(
    persistence: StockSubscriptionEntity,
  ): StockSubscriptionDomain {
    try {
      return StockSubscriptionDomain.fromPersistence({
        id: persistence.id,
        member_id: persistence.memberId,
        stock_id: persistence.stockId,
        quantity: persistence.quantity,
        status: persistence.status,
        purchase_date: persistence.purchaseDate,
        financing_loan_id: persistence.financingLoanId ?? null,
      });
    } catch (error) {
      throw new Error(
        `Failed to map StockSubscription to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(
    domain: StockSubscriptionDomain,
  ): Partial<StockSubscriptionEntity> {
    return {
      id: domain.id,
      memberId: domain.memberId,
      stockId: domain.stockId,
      quantity: domain.quantity,
      status: domain.status,
      purchaseDate: domain.purchaseDate,
      financingLoanId: domain.financingLoanId ?? null,
    };
  }
}
