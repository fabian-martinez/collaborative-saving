import { Stock } from '@domain/entities/stock.entity';
import { Stock as StockEntity } from '../entities/stock.entity';

export class StockMapper {
  static toDomain(persistence: StockEntity): Stock {
    try {
      return Stock.fromPersistence({
        id: persistence.id,
        name: persistence.name,
        value: Number(persistence.value),
        monthly_contribution: Number(persistence.monthly_contribution),
        is_guaranteed: persistence.stockType?.isGuaranteed ?? false,
        guaranteed_yield: persistence.stockType?.guaranteedYield
          ? Number(persistence.stockType.guaranteedYield)
          : null,
        stock_type_id: persistence.stockTypeId,
        created_at:
          (persistence as unknown as { created_at?: Date | string })
            .created_at || new Date(),
        deleted_at: persistence.deleted_at,
      });
    } catch (error) {
      throw new Error(
        `Failed to map Stock to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: Stock): Partial<StockEntity> {
    const result: Partial<StockEntity> = {
      id: domain.id,
      name: domain.name,
      value: domain.value,
      monthly_contribution: domain.monthlyContribution,
      stockTypeId: domain.stockTypeId,
    };

    // Handle deleted_at - solo incluir si está marcado como eliminado
    if (domain.deletedAt) {
      (result as { deleted_at?: Date | null }).deleted_at = domain.deletedAt;
    }

    return result;
  }
}
