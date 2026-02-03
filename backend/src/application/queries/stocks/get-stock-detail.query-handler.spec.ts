import { GetStockDetailQueryHandler } from './get-stock-detail.query-handler';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

describe('GetStockDetailQueryHandler', () => {
  let handler: GetStockDetailQueryHandler;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;
  let findByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    stockTypeRepository = {
      findByStockId: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;
    stockRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    findByIdSpy = jest.spyOn(stockRepository, 'findById');

    handler = new GetStockDetailQueryHandler(stockRepository, stockTypeRepository);
  });

  it('should return stock detail when found', async () => {
    // ARRANGE
    const stockType = StockType.create({
      id: 'stock-type-id-1',
      name: 'Acción A',
      isGuaranteed: true,
      guaranteedYield: 0.05,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });
    const stock = Stock.create({
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
      stockTypeId: stockType.id,
    });

    stockRepository.findById.mockResolvedValue(stock);
    stockTypeRepository.findByStockId.mockResolvedValue(stockType);

    // ACT
    const result = await handler.execute(stock.id);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(stock.id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: stock.id,
      name: stock.name,
      value: stock.value,
      monthlyContribution: stock.monthlyContribution,
      createdAt: stock.createdAt,
      stockType,
    });
  });

  it('should return stock with all fields', async () => {
    // ARRANGE
    const stockType = StockType.create({
      id: 'stock-type-id-1',
      name: 'Acción A',
      isGuaranteed: true,
      guaranteedYield: 0.05,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });
    const stock = Stock.create({
      name: 'guaranteed',
      value: 150,
      monthlyContribution: 75,
      stockTypeId: stockType.id,
    });

    stockRepository.findById.mockResolvedValue(stock);
    stockTypeRepository.findByStockId.mockResolvedValue(stockType);

    // ACT
    const result = await handler.execute(stock.id);

    // ASSERT
    expect(result.name).toBe('guaranteed');
    expect(result.value).toBe(150);
    expect(result.monthlyContribution).toBe(75);
    expect(result.createdAt).toBe(stock.createdAt);
    expect(result.stockType).toBe(stockType);
  });

  it('should throw StockNotFoundException when stock not found', async () => {
    // ARRANGE
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    stockRepository.findById.mockResolvedValue(null);
    stockTypeRepository.findByStockId.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(handler.execute(stockId)).rejects.toThrow(
      StockNotFoundException,
    );
    await expect(handler.execute(stockId)).rejects.toThrow(
      `Stock with ID ${stockId} not found`,
    );
    expect(findByIdSpy).toHaveBeenCalledWith(stockId);
  });
});
