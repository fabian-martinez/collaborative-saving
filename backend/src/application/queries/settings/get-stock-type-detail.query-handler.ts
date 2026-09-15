/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockTypeResponseDto } from '@application/dto/settings/stock-type-response.dto';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

export class GetStockTypeDetailQueryHandler {
  constructor(private readonly stockTypeRepository: StockTypeRepository) {}

  async execute(id: string): Promise<StockTypeResponseDto> {
    const stockType = await this.stockTypeRepository.findById(id);
    if (!stockType) {
      throw new StockTypeNotFoundException(id);
    }

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
