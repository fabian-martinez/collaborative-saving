/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetStockTypeDetailQueryHandler } from './get-stock-type-detail.query-handler';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

describe('GetStockTypeDetailQueryHandler', () => {
  let queryHandler: GetStockTypeDetailQueryHandler;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;

  beforeEach(() => {
    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    queryHandler = new GetStockTypeDetailQueryHandler(stockTypeRepository);
  });

  it('should return stock type details when found', async () => {
    // ARRANGE
    const st = StockType.create({
      name: 'Preferencial',
      behavior: StockBehavior.DIVIDEND_YIELD,
      isGuaranteed: true,
      guaranteedYield: 0.02,
      description: 'Acción con rendimiento garantizado',
    });

    stockTypeRepository.findById.mockResolvedValue(st);

    // ACT
    const result = await queryHandler.execute(st.id);

    // ASSERT
    expect(result.id).toBe(st.id);
    expect(result.code).toBe(st.code);
    expect(result.name).toBe('Preferencial');
    expect(result.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
    expect(result.isGuaranteed).toBe(true);
    expect(result.guaranteedYield).toBe(0.02);
    expect(result.description).toBe('Acción con rendimiento garantizado');
  });

  it('should throw StockTypeNotFoundException when not found', async () => {
    // ARRANGE
    stockTypeRepository.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(queryHandler.execute('non-existent-id')).rejects.toThrow(
      StockTypeNotFoundException,
    );
  });
});
