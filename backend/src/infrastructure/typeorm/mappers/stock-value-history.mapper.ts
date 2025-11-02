import { StockValueHistory as StockValueHistoryDomain } from '@domain/entities/stock-value-history.entity';
import { StockValueHistory as StockValueHistoryEntity } from '../entities/stock-value-history.entity';

export class StockValueHistoryMapper {
  static toDomain(
    persistence: StockValueHistoryEntity,
  ): StockValueHistoryDomain {
    try {
      return StockValueHistoryDomain.fromPersistence({
        id: persistence.id,
        stock_id: persistence.stockId,
        operation_id: persistence.operationId,
        previous_value: persistence.previousValue,
        growth_from_contributions: persistence.growthFromContributions,
        growth_from_interest: persistence.growthFromInterest,
        total_growth_per_share: persistence.totalGrowthPerShare,
        new_value: persistence.newValue,
        created_at: persistence.createdAt,
      });
    } catch (error) {
      throw new Error(
        `Failed to map StockValueHistory to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(
    domain: StockValueHistoryDomain,
  ): Partial<StockValueHistoryEntity> {
    return {
      id: domain.id,
      stockId: domain.stockId,
      operationId: domain.operationId,
      previousValue: domain.previousValue,
      growthFromContributions: domain.growthFromContributions,
      growthFromInterest: domain.growthFromInterest,
      totalGrowthPerShare: domain.totalGrowthPerShare,
      newValue: domain.newValue,
    };
  }
}
