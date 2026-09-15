/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { UpdateStockTypeUseCase } from './update-stock-type.use-case';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

describe('UpdateStockTypeUseCase', () => {
  let useCase: UpdateStockTypeUseCase;
  let mockStockTypeRepo: jest.Mocked<StockTypeRepository>;
  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStockTypeRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    findByIdSpy = jest.spyOn(mockStockTypeRepo, 'findById');
    saveSpy = jest.spyOn(mockStockTypeRepo, 'save');

    useCase = new UpdateStockTypeUseCase(mockStockTypeRepo);
  });

  it('should update existing stock type and persist', async () => {
    // ARRANGE
    const existing = StockType.create({
      name: 'Viejo Nombre',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
      isGuaranteed: false,
    });

    mockStockTypeRepo.findById.mockResolvedValue(existing);
    mockStockTypeRepo.save.mockImplementation((st) => Promise.resolve(st));

    // ACT
    const result = await useCase.execute(existing.id, {
      name: 'Nuevo Nombre',
      behavior: StockBehavior.DIVIDEND_YIELD,
      isGuaranteed: true,
      guaranteedYield: 0.03,
      description: 'Actualizado',
    });

    // ASSERT
    expect(result.name).toBe('Nuevo Nombre');
    expect(result.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
    expect(result.isGuaranteed).toBe(true);
    expect(result.guaranteedYield).toBe(0.03);
    expect(result.description).toBe('Actualizado');
    expect(findByIdSpy).toHaveBeenCalledWith(existing.id);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw StockTypeNotFoundException if stock type does not exist', async () => {
    // ARRANGE
    mockStockTypeRepo.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(
      useCase.execute('invalid-id', { name: 'Otro' }),
    ).rejects.toThrow(StockTypeNotFoundException);
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
