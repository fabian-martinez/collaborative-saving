/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Stock } from '@domain/entities/stock.entity';
import { Stock as StockEntity } from '../entities/stock.entity';

export class StockMapper {
  static toDomain(persistence: StockEntity): Stock {
    try {
      return Stock.fromPersistence({
        id: persistence.id,
        name: persistence.name || persistence.type,
        type: persistence.name || persistence.type,
        stock_type_id: persistence.stock_type_id,
        value: Number(persistence.value),
        monthly_contribution: Number(persistence.monthly_contribution),
        is_guaranteed: persistence.is_guaranteed,
        guaranteed_yield: persistence.guaranteed_yield
          ? Number(persistence.guaranteed_yield)
          : null,
        behavior: persistence.behavior,
        created_at: persistence.created_at || new Date(),
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
      type: domain.name,
      stock_type_id: domain.stockTypeId,
      value: domain.value,
      monthly_contribution: domain.monthlyContribution,
      is_guaranteed: domain.isGuaranteed,
      guaranteed_yield: domain.guaranteedYield,
      behavior: domain.behavior,
    };

    // Handle deleted_at - solo incluir si está marcado como eliminado
    if (domain.deletedAt) {
      (result as { deleted_at?: Date | null }).deleted_at = domain.deletedAt;
    }

    return result;
  }
}
