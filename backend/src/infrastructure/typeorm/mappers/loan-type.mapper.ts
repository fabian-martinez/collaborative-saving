/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanType as LoanTypeDomain } from '@domain/entities/loan-type.entity';
import { LoanType as LoanTypeEntity } from '../entities/loan-type.entity';

export class LoanTypeMapper {
  static toDomain(persistence: LoanTypeEntity): LoanTypeDomain {
    try {
      return LoanTypeDomain.fromPersistence({
        id: persistence.id,
        code: persistence.code,
        name: persistence.name,
        interest_rate: persistence.interest_rate,
        description: persistence.description,
        created_at: persistence.created_at,
        updated_at: persistence.updated_at,
        deleted_at: persistence.deleted_at,
      });
    } catch (error) {
      throw new Error(
        `Failed to map LoanType to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: LoanTypeDomain): Partial<LoanTypeEntity> {
    return {
      id: domain.id,
      code: domain.code,
      name: domain.name,
      interest_rate: domain.interestRate,
      description: domain.description !== undefined ? domain.description : null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
      deleted_at: domain.deletedAt !== undefined ? domain.deletedAt : null,
    };
  }
}
