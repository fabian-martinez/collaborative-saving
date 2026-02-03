import { CreateStockUseCase } from './create-stock.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockType } from '@domain/entities/stock-type.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('CreateStockUseCase', () => {
  let useCase: CreateStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;
  let findByNameSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    stockRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    stockTypeRepository = {
      findByStockId: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;
    // Create spies to avoid 'this' scoping issues
    findByNameSpy = jest.spyOn(stockRepository, 'findByName');
    saveSpy = jest.spyOn(stockRepository, 'save');

    useCase = new CreateStockUseCase(stockRepository, stockTypeRepository);
  });

  it('should create a stock successfully', async () => {
    // ARRANGE
    const stockTypeId = '1';
    const stockType = StockType.create({
      id: stockTypeId,
      name: 'preferential',
      guaranteedYield: 10,
      isGuaranteed: false,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });
    const createDto = {
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
      stockTypeId,
    };

    stockRepository.findByName.mockResolvedValue(null);
    stockTypeRepository.findByStockId.mockResolvedValue(stockType);
    const savedStock = Stock.create(createDto);
    stockRepository.save.mockResolvedValue(savedStock);

    // ACT
    const result = await useCase.execute(createDto);

    // ASSERT
    expect(findByNameSpy).toHaveBeenCalledWith('preferential');
    expect(findByNameSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: savedStock.id,
      name: savedStock.name,
      value: savedStock.value,
      monthlyContribution: savedStock.monthlyContribution,
      stockType: stockType,
      createdAt: savedStock.createdAt,
    });
  });

  it('should create a stock with all optional fields', async () => {
    // ARRANGE
    const stockTypeId = '1';
    const stockType = StockType.create({
      id: stockTypeId,
      name: 'preferential',
      guaranteedYield: 10,
      isGuaranteed: false,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });
    const createDto = {
      name: 'guaranteed',
      value: 150,
      monthlyContribution: 75,
      stockTypeId,
    };

    stockRepository.findByName.mockResolvedValue(null);
    stockTypeRepository.findByStockId.mockResolvedValue(stockType);
    const savedStock = Stock.create(createDto);
    stockRepository.save.mockResolvedValue(savedStock);

    // ACT
    const result = await useCase.execute(createDto);

    // ASSERT
    expect(result.name).toBe('guaranteed');
    expect(result.value).toBe(150);
    expect(result.monthlyContribution).toBe(75);
    expect(result.stockType).toBe(stockType);
    expect(result.createdAt).toBe(savedStock.createdAt);
  });

  it('should throw InvalidRequestError if stock name already exists', async () => {
    // ARRANGE
    const createDto = {
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
      stockTypeId: '1',
    };

    const existingStock = Stock.create(createDto);
    stockRepository.findByName.mockResolvedValue(existingStock);

    // ACT & ASSERT
    await expect(useCase.execute(createDto)).rejects.toThrow(
      InvalidRequestError,
    );
    await expect(useCase.execute(createDto)).rejects.toThrow(
      'Stock with name "preferential" already exists',
    );

    expect(findByNameSpy).toHaveBeenCalledWith('preferential');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should allow creating stock with same name if existing is deleted', async () => {
    // ARRANGE
    const stockTypeId = '1';
    const stockType = StockType.create({
      id: stockTypeId,
      name: 'preferential',
      guaranteedYield: 10,
      isGuaranteed: false,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });
    const createDto = {
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
      stockTypeId,
    };

    const deletedStock = Stock.create(createDto);
    deletedStock.markAsDeleted();
    stockRepository.findByName.mockResolvedValue(deletedStock);
    stockTypeRepository.findByStockId.mockResolvedValue(stockType);
    const newStock = Stock.create(createDto);
    stockRepository.save.mockResolvedValue(newStock);

    // ACT
    const result = await useCase.execute(createDto);

    // ASSERT
    expect(result).toBeDefined();
    expect(findByNameSpy).toHaveBeenCalledWith('preferential');
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('preferential');
  });
});
