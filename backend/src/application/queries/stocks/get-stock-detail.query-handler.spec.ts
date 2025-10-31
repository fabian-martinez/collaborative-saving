import { GetStockDetailQueryHandler } from './get-stock-detail.query-handler';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { NotFoundException } from '@nestjs/common';

describe('GetStockDetailQueryHandler', () => {
  let handler: GetStockDetailQueryHandler;
  let stockRepository: jest.Mocked<StockRepository>;
  let findByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    findByIdSpy = jest.spyOn(stockRepository, 'findById');

    handler = new GetStockDetailQueryHandler(stockRepository);
  });

  it('should return stock detail when found', async () => {
    // ARRANGE
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    const stock = Stock.create({
      type: 'preferential',
      value: 100,
      monthlyContribution: 50,
    });

    stockRepository.findById.mockResolvedValue(stock);

    // ACT
    const result = await handler.execute(stockId);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(stockId);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: stock.id,
      type: stock.type,
      value: stock.value,
      monthlyContribution: stock.monthlyContribution,
      isGuaranteed: stock.isGuaranteed,
      guaranteedYield: stock.guaranteedYield,
      behavior: stock.behavior,
      createdAt: stock.createdAt,
    });
  });

  it('should return stock with all fields', async () => {
    // ARRANGE
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    const stock = Stock.create({
      type: 'guaranteed',
      value: 150,
      monthlyContribution: 75,
      isGuaranteed: true,
      guaranteedYield: 0.02,
      behavior: StockBehavior.DIVIDEND_YIELD,
    });

    stockRepository.findById.mockResolvedValue(stock);

    // ACT
    const result = await handler.execute(stockId);

    // ASSERT
    expect(result.type).toBe('guaranteed');
    expect(result.value).toBe(150);
    expect(result.monthlyContribution).toBe(75);
    expect(result.isGuaranteed).toBe(true);
    expect(result.guaranteedYield).toBe(0.02);
    expect(result.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
  });

  it('should throw NotFoundException when stock not found', async () => {
    // ARRANGE
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    stockRepository.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(handler.execute(stockId)).rejects.toThrow(NotFoundException);
    await expect(handler.execute(stockId)).rejects.toThrow(
      `Stock with ID ${stockId} not found`,
    );
    expect(findByIdSpy).toHaveBeenCalledWith(stockId);
  });
});
