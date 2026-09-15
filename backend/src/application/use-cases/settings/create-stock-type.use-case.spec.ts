/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { CreateStockTypeUseCase } from './create-stock-type.use-case';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

describe('CreateStockTypeUseCase', () => {
  let useCase: CreateStockTypeUseCase;
  let mockStockTypeRepo: jest.Mocked<StockTypeRepository>;
  let findByCodeSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStockTypeRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    findByCodeSpy = jest.spyOn(mockStockTypeRepo, 'findByCode');
    saveSpy = jest.spyOn(mockStockTypeRepo, 'save');
    useCase = new CreateStockTypeUseCase(mockStockTypeRepo);
  });

  it('should successfully create and save a new stock type', async () => {
    // ARRANGE
    const dto = {
      name: 'Acción Ordinaria',
      description: 'Acción común',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
      isGuaranteed: false,
    };

    mockStockTypeRepo.findByCode.mockResolvedValue(null);
    mockStockTypeRepo.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(result.name).toBe('Acción Ordinaria');
    expect(result.code).toBe('accion_ordinaria');
    expect(result.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
    expect(result.isGuaranteed).toBe(false);
    expect(result.guaranteedYield).toBeNull();
    expect(findByCodeSpy).toHaveBeenCalledWith('accion_ordinaria');
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw error if code already exists', async () => {
    // ARRANGE
    const dto = {
      name: 'Acción Ordinaria',
      code: 'ordinaria',
    };
    const existing = StockType.create(dto);
    mockStockTypeRepo.findByCode.mockResolvedValue(existing);

    // ACT & ASSERT
    await expect(useCase.execute(dto)).rejects.toThrow(
      "A stock type with code 'ordinaria' already exists",
    );
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
