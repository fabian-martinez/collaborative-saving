/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockType as StockTypeDomain } from '@domain/entities/stock-type.entity';
import { StockType as StockTypeEntity } from '../entities/stock-type.entity';

export class StockTypeMapper {
  static toDomain(persistence: StockTypeEntity): StockTypeDomain {
    try {
      return StockTypeDomain.fromPersistence({
        id: persistence.id,
        code: persistence.code,
        name: persistence.name,
        behavior: persistence.behavior,
        is_guaranteed: persistence.is_guaranteed,
        guaranteed_yield:
          persistence.guaranteed_yield !== null &&
          persistence.guaranteed_yield !== undefined
            ? Number(persistence.guaranteed_yield)
            : null,
        description: persistence.description,
        created_at: persistence.created_at,
        updated_at: persistence.updated_at,
        deleted_at: persistence.deleted_at,
      });
    } catch (error) {
      throw new Error(
        `Failed to map StockType to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: StockTypeDomain): Partial<StockTypeEntity> {
    return {
      id: domain.id,
      code: domain.code,
      name: domain.name,
      behavior: domain.behavior,
      is_guaranteed: domain.isGuaranteed,
      guaranteed_yield: domain.guaranteedYield,
      description: domain.description !== undefined ? domain.description : null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
      deleted_at: domain.deletedAt !== undefined ? domain.deletedAt : null,
    };
  }
}
