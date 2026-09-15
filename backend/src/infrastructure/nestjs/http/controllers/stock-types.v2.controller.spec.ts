/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockTypesV2Controller } from './stock-types.v2.controller';
import { CreateStockTypeUseCase } from '@application/use-cases/settings/create-stock-type.use-case';
import { UpdateStockTypeUseCase } from '@application/use-cases/settings/update-stock-type.use-case';
import { DeleteStockTypeUseCase } from '@application/use-cases/settings/delete-stock-type.use-case';
import { GetStockTypesQueryHandler } from '@application/queries/settings/get-stock-types.query-handler';
import { GetStockTypeDetailQueryHandler } from '@application/queries/settings/get-stock-type-detail.query-handler';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

describe('StockTypesV2Controller', () => {
  let controller: StockTypesV2Controller;
  let getStockTypesQuery: jest.Mocked<GetStockTypesQueryHandler>;
  let getStockTypeDetailQuery: jest.Mocked<GetStockTypeDetailQueryHandler>;
  let createStockTypeUseCase: jest.Mocked<CreateStockTypeUseCase>;
  let updateStockTypeUseCase: jest.Mocked<UpdateStockTypeUseCase>;
  let deleteStockTypeUseCase: jest.Mocked<DeleteStockTypeUseCase>;
  let createUseCaseSpy: jest.SpyInstance;
  let deleteUseCaseSpy: jest.SpyInstance;

  beforeEach(() => {
    getStockTypesQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetStockTypesQueryHandler>;

    getStockTypeDetailQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetStockTypeDetailQueryHandler>;

    createStockTypeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateStockTypeUseCase>;
    createUseCaseSpy = jest.spyOn(createStockTypeUseCase, 'execute');

    updateStockTypeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateStockTypeUseCase>;

    deleteStockTypeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteStockTypeUseCase>;
    deleteUseCaseSpy = jest.spyOn(deleteStockTypeUseCase, 'execute');

    controller = new StockTypesV2Controller(
      getStockTypesQuery,
      getStockTypeDetailQuery,
      createStockTypeUseCase,
      updateStockTypeUseCase,
      deleteStockTypeUseCase,
    );
  });

  describe('list', () => {
    it('should return mapped array of stock types', async () => {
      // ARRANGE
      getStockTypesQuery.execute.mockResolvedValue([
        {
          id: 'st-1',
          code: 'ordinaria',
          name: 'Ordinaria',
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          isGuaranteed: false,
          guaranteedYield: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // ACT
      const result = await controller.list();

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
      expect(result[0].code).toBe('ordinaria');
      expect(result[0].is_guaranteed).toBe(false);
    });
  });

  describe('detail', () => {
    it('should return stock type by id', async () => {
      // ARRANGE
      getStockTypeDetailQuery.execute.mockResolvedValue({
        id: 'st-1',
        code: 'preferencial',
        name: 'Preferencial',
        behavior: StockBehavior.DIVIDEND_YIELD,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        description: 'Acción preferencial',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ACT
      const result = await controller.detail('st-1');

      // ASSERT
      expect(result.id).toBe('st-1');
      expect(result.name).toBe('Preferencial');
      expect(result.is_guaranteed).toBe(true);
      expect(result.guaranteed_yield).toBe(0.02);
    });

    it('should throw NotFoundException when stock type does not exist', async () => {
      // ARRANGE
      getStockTypeDetailQuery.execute.mockRejectedValue(
        new StockTypeNotFoundException('st-none'),
      );

      // ACT & ASSERT
      await expect(controller.detail('st-none')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return newly created stock type', async () => {
      // ARRANGE
      const dto = {
        name: 'CDT 30 Días',
        behavior: StockBehavior.DIVIDEND_YIELD,
        is_guaranteed: true,
        guaranteed_yield: 0.025,
      };

      createStockTypeUseCase.execute.mockResolvedValue({
        id: 'st-new',
        code: 'cdt_30_dias',
        name: 'CDT 30 Días',
        behavior: StockBehavior.DIVIDEND_YIELD,
        isGuaranteed: true,
        guaranteedYield: 0.025,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ACT
      const result = await controller.create(dto);

      // ASSERT
      expect(createUseCaseSpy).toHaveBeenCalledWith({
        name: dto.name,
        code: undefined,
        behavior: dto.behavior,
        isGuaranteed: dto.is_guaranteed,
        guaranteedYield: dto.guaranteed_yield,
        description: undefined,
      });
      expect(result.id).toBe('st-new');
      expect(result.code).toBe('cdt_30_dias');
      expect(result.is_guaranteed).toBe(true);
      expect(result.guaranteed_yield).toBe(0.025);
    });

    it('should throw BadRequestException if use case fails', async () => {
      // ARRANGE
      createStockTypeUseCase.execute.mockRejectedValue(
        new Error('Duplicate code'),
      );

      // ACT & ASSERT
      await expect(controller.create({ name: 'Acción' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update and return updated stock type', async () => {
      // ARRANGE
      const dto = {
        name: 'Acción Actualizada',
        is_guaranteed: false,
      };

      updateStockTypeUseCase.execute.mockResolvedValue({
        id: 'st-1',
        code: 'ordinaria',
        name: 'Acción Actualizada',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        guaranteedYield: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ACT
      const result = await controller.update('st-1', dto);

      // ASSERT
      expect(result.name).toBe('Acción Actualizada');
      expect(result.is_guaranteed).toBe(false);
    });

    it('should throw NotFoundException on StockTypeNotFoundException', async () => {
      // ARRANGE
      updateStockTypeUseCase.execute.mockRejectedValue(
        new StockTypeNotFoundException('st-none'),
      );

      // ACT & ASSERT
      await expect(controller.update('st-none', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException on general error', async () => {
      // ARRANGE
      updateStockTypeUseCase.execute.mockRejectedValue(
        new Error('Validation error'),
      );

      // ACT & ASSERT
      await expect(controller.update('st-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete stock type successfully', async () => {
      // ARRANGE
      deleteStockTypeUseCase.execute.mockResolvedValue();

      // ACT & ASSERT
      await expect(controller.remove('st-1')).resolves.toBeUndefined();
      expect(deleteUseCaseSpy).toHaveBeenCalledWith('st-1');
    });

    it('should throw NotFoundException if stock type is not found', async () => {
      // ARRANGE
      deleteStockTypeUseCase.execute.mockRejectedValue(
        new StockTypeNotFoundException('st-none'),
      );

      // ACT & ASSERT
      await expect(controller.remove('st-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if deletion is blocked due to active stocks', async () => {
      // ARRANGE
      deleteStockTypeUseCase.execute.mockRejectedValue(
        new Error(
          'Cannot delete stock type because it has active stocks associated',
        ),
      );

      // ACT & ASSERT
      await expect(controller.remove('st-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
