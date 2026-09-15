/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { CreateStockDto } from '@application/dto/stocks/create-stock.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { Stock } from '@domain/entities/stock.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class CreateStockUseCase {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(dto: CreateStockDto): Promise<StockResponseDto> {
    const name = dto.name || dto.type;
    if (!name) {
      throw new InvalidRequestError('Stock name is required');
    }

    // Validar que no exista un stock con el mismo nombre o tipo
    let existing: Stock | null = null;
    if (this.stockRepository.findByName) {
      existing = await this.stockRepository.findByName(name);
    } else {
      existing = await this.stockRepository.findByType(name);
    }

    if (existing && !existing.isDeleted()) {
      throw new InvalidRequestError(`Stock with name "${name}" already exists`);
    }

    const stock = Stock.create({
      name,
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
