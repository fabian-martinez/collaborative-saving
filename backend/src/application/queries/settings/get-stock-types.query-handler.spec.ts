/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetStockTypesQueryHandler } from './get-stock-types.query-handler';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

describe('GetStockTypesQueryHandler', () => {
  let queryHandler: GetStockTypesQueryHandler;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;

  beforeEach(() => {
    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    queryHandler = new GetStockTypesQueryHandler(stockTypeRepository);
  });

  it('should return all stock types mapped to response DTOs', () => {
    // ARRANGE
    const st1 = StockType.create({
      name: 'Ordinaria',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
      isGuaranteed: false,
    });
    const st2 = StockType.create({
      name: 'Preferencial',
      behavior: StockBehavior.DIVIDEND_YIELD,
      isGuaranteed: true,
      guaranteedYield: 0.02,
    });

    stockTypeRepository.findAll.mockResolvedValue([st1, st2]);

    // ACT
    return queryHandler.execute().then((result) => {
      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(st1.id);
      expect(result[0].code).toBe(st1.code);
      expect(result[0].name).toBe('Ordinaria');
      expect(result[0].behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
      expect(result[0].isGuaranteed).toBe(false);
      expect(result[0].guaranteedYield).toBeNull();

      expect(result[1].id).toBe(st2.id);
      expect(result[1].name).toBe('Preferencial');
      expect(result[1].behavior).toBe(StockBehavior.DIVIDEND_YIELD);
      expect(result[1].isGuaranteed).toBe(true);
      expect(result[1].guaranteedYield).toBe(0.02);
    });
  });

  it('should return empty array if no stock types exist', () => {
    // ARRANGE
    stockTypeRepository.findAll.mockResolvedValue([]);

    // ACT & ASSERT
    return expect(queryHandler.execute()).resolves.toEqual([]);
  });
});
