import { GetStocksQueryHandler } from './get-stocks.query-handler';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';

describe('GetStocksQueryHandler', () => {
  let handler: GetStocksQueryHandler;
  let stockRepository: jest.Mocked<StockRepository>;
  let findActiveSpy: jest.SpyInstance;

  beforeEach(() => {
    stockRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    findActiveSpy = jest.spyOn(stockRepository, 'findActive');

    handler = new GetStocksQueryHandler(stockRepository);
  });

  it('should return empty array when no stocks', async () => {
    // ARRANGE
    stockRepository.findActive.mockResolvedValue([]);

    // ACT
    const result = await handler.execute();

    // ASSERT
    expect(result).toEqual([]);
    expect(findActiveSpy).toHaveBeenCalledTimes(1);
  });

  it('should return list of active stocks', async () => {
    // ARRANGE
    const stocks = [
      Stock.create({
        name: 'preferential',
        value: 100,
        monthlyContribution: 50,
      }),
      Stock.create({
        name: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
      }),
    ];

    stockRepository.findActive.mockResolvedValue(stocks);

    // ACT
    const result = await handler.execute();

    // ASSERT
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: stocks[0].id,
      name: stocks[0].name,
      value: stocks[0].value,
      monthlyContribution: stocks[0].monthlyContribution,
      isGuaranteed: stocks[0].isGuaranteed,
      guaranteedYield: stocks[0].guaranteedYield,
      createdAt: stocks[0].createdAt,
    });
    expect(result[1]).toEqual({
      id: stocks[1].id,
      name: stocks[1].name,
      value: stocks[1].value,
      monthlyContribution: stocks[1].monthlyContribution,
      isGuaranteed: stocks[1].isGuaranteed,
      guaranteedYield: stocks[1].guaranteedYield,
      createdAt: stocks[1].createdAt,
    });
    expect(findActiveSpy).toHaveBeenCalledTimes(1);
  });
});
