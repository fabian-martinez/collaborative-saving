/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockTypeResponseDto } from '@application/dto/settings/stock-type-response.dto';

export class GetStockTypesQueryHandler {
  constructor(private readonly stockTypeRepository: StockTypeRepository) {}

  async execute(): Promise<StockTypeResponseDto[]> {
    const stockTypes = await this.stockTypeRepository.findAll();

    return stockTypes.map((stockType) => ({
      id: stockType.id,
      code: stockType.code,
      name: stockType.name,
      behavior: stockType.behavior,
      isGuaranteed: stockType.isGuaranteed,
      guaranteedYield: stockType.guaranteedYield,
      description: stockType.description,
      createdAt: stockType.createdAt,
      updatedAt: stockType.updatedAt,
    }));
  }
}
