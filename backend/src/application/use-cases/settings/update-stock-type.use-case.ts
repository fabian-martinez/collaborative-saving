/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockType } from '@domain/entities/stock-type.entity';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { UpdateStockTypeDto } from '@application/dto/settings/update-stock-type.dto';
import { StockTypeResponseDto } from '@application/dto/settings/stock-type-response.dto';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

export class UpdateStockTypeUseCase {
  constructor(private readonly stockTypeRepository: StockTypeRepository) {}

  async execute(
    id: string,
    dto: UpdateStockTypeDto,
  ): Promise<StockTypeResponseDto> {
    const stockType = await this.stockTypeRepository.findById(id);
    if (!stockType) {
      throw new StockTypeNotFoundException(id);
    }

    stockType.update(dto);

    const updated = await this.stockTypeRepository.save(stockType);

    return this.toDto(updated);
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
