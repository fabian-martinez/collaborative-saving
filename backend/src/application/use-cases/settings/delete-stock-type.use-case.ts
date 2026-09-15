/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

export class DeleteStockTypeUseCase {
  constructor(
    private readonly stockTypeRepository: StockTypeRepository,
    private readonly stockRepository?: StockRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const stockType = await this.stockTypeRepository.findById(id);
    if (!stockType) {
      throw new StockTypeNotFoundException(id);
    }

    const hasActiveStocks = this.stockRepository?.hasActiveStocksByType
      ? await this.stockRepository.hasActiveStocksByType(stockType.code)
      : false;

    if (hasActiveStocks) {
      throw new Error(
        `Cannot delete stock type '${stockType.name}' because it has active stocks associated`,
      );
    }

    await this.stockTypeRepository.softDelete(id);
  }
}
