/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType as StockTypeDomain } from '@domain/entities/stock-type.entity';
import { StockType as StockTypeEntity } from '../entities/stock-type.entity';
import { StockTypeMapper } from '../mappers/stock-type.mapper';

@Injectable()
export class TypeOrmStockTypeRepository implements StockTypeRepository {
  private readonly logger = new Logger(TypeOrmStockTypeRepository.name);

  constructor(
    @InjectRepository(StockTypeEntity)
    private readonly repo: Repository<StockTypeEntity>,
  ) {}

  async findById(id: string): Promise<StockTypeDomain | null> {
    const entity = await this.repo.findOne({
      where: { id, deleted_at: IsNull() },
    });
    return entity ? StockTypeMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<StockTypeDomain | null> {
    const entity = await this.repo.findOne({
      where: { code, deleted_at: IsNull() },
    });
    return entity ? StockTypeMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StockTypeDomain[]> {
    const entities = await this.repo.find({
      where: { deleted_at: IsNull() },
      order: { name: 'ASC' },
    });

    const validStockTypes: StockTypeDomain[] = [];
    for (const entity of entities) {
      try {
        validStockTypes.push(StockTypeMapper.toDomain(entity));
      } catch (error) {
        this.logger.warn(
          `Skipping invalid stock type ${entity.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return validStockTypes;
  }

  async save(stockType: StockTypeDomain): Promise<StockTypeDomain> {
    const persistence = StockTypeMapper.toPersistence(stockType);

    const existing = await this.repo.findOne({
      where: { id: stockType.id },
      withDeleted: true,
    });

    if (existing) {
      const updatedEntity = this.repo.merge(existing, persistence);
      const saved = await this.repo.save(updatedEntity);
      return StockTypeMapper.toDomain(saved);
    } else {
      const saved = await this.repo.save(persistence as StockTypeEntity);
      return StockTypeMapper.toDomain(saved);
    }
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.repo.softDelete(id);
    if (!result.affected || result.affected === 0) {
      throw new Error(`StockType with ID ${id} not found`);
    }
  }
}
