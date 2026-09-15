/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { UpdateStockDto } from '@application/dto/stocks/update-stock.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { Stock } from '@domain/entities/stock.entity';

export class UpdateStockUseCase {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(
    stockId: string,
    dto: UpdateStockDto,
  ): Promise<StockResponseDto> {
    const stock = await this.stockRepository.findById(stockId);

    if (!stock) {
      throw new StockNotFoundException(stockId);
    }

    if (stock.isDeleted()) {
      throw new InvalidRequestError(`Stock with ID ${stockId} is deleted`);
    }

    const newName = dto.name !== undefined ? dto.name : dto.type;

    // Si se está actualizando el nombre, verificar que no exista otro stock con el mismo nombre
    if (newName && newName !== stock.name) {
      let existing: Stock | null = null;
      if (this.stockRepository.findByName) {
        existing = await this.stockRepository.findByName(newName);
      } else {
        existing = await this.stockRepository.findByType(newName);
      }
      if (existing && existing.id !== stockId && !existing.isDeleted()) {
        throw new InvalidRequestError(
          `Stock with name "${newName}" already exists`,
        );
      }
    }

    stock.update({
      name: newName,
      stockTypeId: dto.stockTypeId,
      value: dto.value,
      monthlyContribution: dto.monthlyContribution,
      isGuaranteed: dto.isGuaranteed,
      guaranteedYield: dto.guaranteedYield,
      behavior: dto.behavior,
    });

    const saved = await this.stockRepository.save(stock);

    return {
      id: saved.id,
      name: saved.name,
      type: saved.name,
      stockTypeId: saved.stockTypeId,
      value: saved.value,
      monthlyContribution: saved.monthlyContribution,
      isGuaranteed: saved.isGuaranteed,
      guaranteedYield: saved.guaranteedYield,
      behavior: saved.behavior,
      createdAt: saved.createdAt,
    };
  }
}
