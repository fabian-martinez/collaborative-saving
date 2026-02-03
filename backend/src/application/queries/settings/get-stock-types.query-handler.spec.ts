import { GetStockTypesQueryHandler } from './get-stock-types.query-handler';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/entities/stock.entity';

describe('GetStockTypesQueryHandler', () => {
  let queryHandler: GetStockTypesQueryHandler;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;

  beforeEach(() => {
    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;

    queryHandler = new GetStockTypesQueryHandler(stockTypeRepository);
  });

  it('should return all stock types from repository', async () => {
    const stockTypes: StockType[] = [
      StockType.create({ 
        id: '1',
        name: 'Stock 1', 
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        guaranteedYield: 0.02,
        isGuaranteed: true,
      }),
      StockType.create({ 
        id: '2',
        name: 'Stock 2', 
        behavior: StockBehavior.DIVIDEND_YIELD,
        guaranteedYield: null,
        isGuaranteed: false,
      }),
    ];

    stockTypeRepository.findAll.mockResolvedValue(stockTypes);

    const result = await queryHandler.execute();

    expect(stockTypeRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(stockTypes);
  });

  it('should return empty array when no stock types exist', async () => {
    stockTypeRepository.findAll.mockResolvedValue([]);

    const result = await queryHandler.execute();

    expect(stockTypeRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
