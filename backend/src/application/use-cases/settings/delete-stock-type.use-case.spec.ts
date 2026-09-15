/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { DeleteStockTypeUseCase } from './delete-stock-type.use-case';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

describe('DeleteStockTypeUseCase', () => {
  let useCase: DeleteStockTypeUseCase;
  let mockStockTypeRepo: jest.Mocked<StockTypeRepository>;
  let mockStockRepo: jest.Mocked<Required<StockRepository>>;
  let findByIdSpy: jest.SpyInstance;
  let softDeleteSpy: jest.SpyInstance;
  let hasActiveStocksByTypeSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStockTypeRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    mockStockRepo = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findGuaranteed: jest.fn(),
      softDelete: jest.fn(),
      hasActiveStocksByType: jest.fn(),
    };
    findByIdSpy = jest.spyOn(mockStockTypeRepo, 'findById');
    softDeleteSpy = jest.spyOn(mockStockTypeRepo, 'softDelete');
    hasActiveStocksByTypeSpy = jest.spyOn(
      mockStockRepo,
      'hasActiveStocksByType',
    );

    useCase = new DeleteStockTypeUseCase(mockStockTypeRepo, mockStockRepo);
  });

  it('should soft delete stock type when no active stocks are associated', async () => {
    // ARRANGE
    const stockType = StockType.create({
      name: 'Especial',
      code: 'especial',
    });
    mockStockTypeRepo.findById.mockResolvedValue(stockType);
    mockStockRepo.hasActiveStocksByType.mockResolvedValue(false);
    mockStockTypeRepo.softDelete.mockResolvedValue();

    // ACT
    await useCase.execute(stockType.id);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(stockType.id);
    expect(hasActiveStocksByTypeSpy).toHaveBeenCalledWith('especial');
    expect(softDeleteSpy).toHaveBeenCalledWith(stockType.id);
  });

  it('should throw StockTypeNotFoundException if stock type is not found', async () => {
    // ARRANGE
    mockStockTypeRepo.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(useCase.execute('invalid-id')).rejects.toThrow(
      StockTypeNotFoundException,
    );
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });

  it('should throw Error and prevent deletion if there are active stocks associated', async () => {
    // ARRANGE
    const stockType = StockType.create({
      name: 'Acción Activa',
      code: 'accion_activa',
    });
    mockStockTypeRepo.findById.mockResolvedValue(stockType);
    mockStockRepo.hasActiveStocksByType.mockResolvedValue(true);

    // ACT & ASSERT
    await expect(useCase.execute(stockType.id)).rejects.toThrow(
      "Cannot delete stock type 'Acción Activa' because it has active stocks associated",
    );
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });
});
