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
      findByType: jest.fn(),
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
        type: 'preferential',
        value: 100,
        monthlyContribution: 50,
      }),
      Stock.create({
        type: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
      }),
    ];

    stockRepository.findActive.mockResolvedValue(stocks);

    // ACT
    const result = await handler.execute();

    // ASSERT
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: stocks[0].id,
      type: stocks[0].type,
      value: stocks[0].value,
      monthlyContribution: stocks[0].monthlyContribution,
      isGuaranteed: stocks[0].isGuaranteed,
      guaranteedYield: stocks[0].guaranteedYield,
      behavior: stocks[0].behavior,
      createdAt: stocks[0].createdAt,
    });
    expect(result[1]).toEqual({
      id: stocks[1].id,
      type: stocks[1].type,
      value: stocks[1].value,
      monthlyContribution: stocks[1].monthlyContribution,
      isGuaranteed: stocks[1].isGuaranteed,
      guaranteedYield: stocks[1].guaranteedYield,
      behavior: stocks[1].behavior,
      createdAt: stocks[1].createdAt,
    });
    expect(findActiveSpy).toHaveBeenCalledTimes(1);
  });
});
