import { Stock } from '@domain/entities/stock.entity';
import { Stock as StockEntity } from '../entities/stock.entity';

export class StockMapper {
  static toDomain(persistence: StockEntity): Stock {
    try {
      return Stock.fromPersistence({
        id: persistence.id,
        name: persistence.name,
        value: Number(persistence.value),
        monthlyContribution: Number(persistence.monthlyContribution),
        stockTypeId: persistence.stockTypeId,
        createdAt:
          (persistence as unknown as { created_at?: Date | string })
            .created_at || new Date(),
        deletedAt: persistence.deletedAt,
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
      monthlyContribution: domain.monthlyContribution,
      stockTypeId: domain.stockTypeId,
    };

    // Handle deleted_at - solo incluir si está marcado como eliminado
    if (domain.deletedAt) {
      (result as { deletedAt?: Date | null }).deletedAt = domain.deletedAt;
    }

    return result;
  }
}
