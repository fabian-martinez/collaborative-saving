/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockType } from '@domain/entities/stock-type.entity';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { CreateStockTypeDto } from '@application/dto/settings/create-stock-type.dto';
import { StockTypeResponseDto } from '@application/dto/settings/stock-type-response.dto';

export class CreateStockTypeUseCase {
  constructor(private readonly stockTypeRepository: StockTypeRepository) {}

  async execute(dto: CreateStockTypeDto): Promise<StockTypeResponseDto> {
    const stockType = StockType.create(dto);

    const existing = await this.stockTypeRepository.findByCode(stockType.code);
    if (existing) {
      throw new Error(
        `A stock type with code '${stockType.code}' already exists`,
      );
    }

    const saved = await this.stockTypeRepository.save(stockType);

    return this.toDto(saved);
  }

  private toDto(stockType: StockType): StockTypeResponseDto {
    return {
      id: stockType.id,
      code: stockType.code,
      name: stockType.name,
      behavior: stockType.behavior,
      isGuaranteed: stockType.isGuaranteed,
      guaranteedYield: stockType.guaranteedYield,
      description: stockType.description,
      createdAt: stockType.createdAt,
      updatedAt: stockType.updatedAt,
    };
  }
}
