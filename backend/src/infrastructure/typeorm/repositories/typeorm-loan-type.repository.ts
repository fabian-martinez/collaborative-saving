/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType as LoanTypeDomain } from '@domain/entities/loan-type.entity';
import { LoanType as LoanTypeEntity } from '../entities/loan-type.entity';
import { LoanTypeMapper } from '../mappers/loan-type.mapper';

@Injectable()
export class TypeOrmLoanTypeRepository implements LoanTypeRepository {
  private readonly logger = new Logger(TypeOrmLoanTypeRepository.name);

  constructor(
    @InjectRepository(LoanTypeEntity)
    private readonly repo: Repository<LoanTypeEntity>,
  ) {}

  async findById(id: string): Promise<LoanTypeDomain | null> {
    const entity = await this.repo.findOne({
      where: { id, deleted_at: IsNull() },
    });
    return entity ? LoanTypeMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<LoanTypeDomain | null> {
    const entity = await this.repo.findOne({
      where: { code, deleted_at: IsNull() },
    });
    return entity ? LoanTypeMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<LoanTypeDomain[]> {
    const entities = await this.repo.find({
      where: { deleted_at: IsNull() },
      order: { name: 'ASC' },
    });

    const validLoanTypes: LoanTypeDomain[] = [];
    for (const entity of entities) {
      try {
        validLoanTypes.push(LoanTypeMapper.toDomain(entity));
      } catch (error) {
        this.logger.warn(
          `Skipping invalid loan type ${entity.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return validLoanTypes;
  }

  async save(loanType: LoanTypeDomain): Promise<LoanTypeDomain> {
    const persistence = LoanTypeMapper.toPersistence(loanType);

    const existing = await this.repo.findOne({
      where: { id: loanType.id },
      withDeleted: true,
    });

    if (existing) {
      const updatedEntity = this.repo.merge(existing, persistence);
      const saved = await this.repo.save(updatedEntity);
      return LoanTypeMapper.toDomain(saved);
    } else {
      const saved = await this.repo.save(persistence as LoanTypeEntity);
      return LoanTypeMapper.toDomain(saved);
    }
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.repo.softDelete(id);
    if (!result.affected || result.affected === 0) {
      throw new Error(`LoanType with ID ${id} not found`);
    }
  }
}
