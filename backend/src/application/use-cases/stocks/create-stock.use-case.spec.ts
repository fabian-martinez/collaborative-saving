import { CreateStockUseCase } from './create-stock.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('CreateStockUseCase', () => {
  let useCase: CreateStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let findByTypeSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    // Create spies to avoid 'this' scoping issues
    findByTypeSpy = jest.spyOn(stockRepository, 'findByType');
    saveSpy = jest.spyOn(stockRepository, 'save');

    useCase = new CreateStockUseCase(stockRepository);
  });

  it('should create a stock successfully', async () => {
    // ARRANGE
    const createDto = {
      type: 'preferential',
      value: 100,
      monthlyContribution: 50,
    };

    stockRepository.findByType.mockResolvedValue(null);
    const savedStock = Stock.create(createDto);
    stockRepository.save.mockResolvedValue(savedStock);

    // ACT
    const result = await useCase.execute(createDto);

    // ASSERT
    expect(findByTypeSpy).toHaveBeenCalledWith('preferential');
    expect(findByTypeSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: savedStock.id,
      name: savedStock.name,
      type: savedStock.type,
      stockTypeId: null,
      value: savedStock.value,
      monthlyContribution: savedStock.monthlyContribution,
      isGuaranteed: savedStock.isGuaranteed,
      guaranteedYield: savedStock.guaranteedYield,
      behavior: savedStock.behavior,
      createdAt: savedStock.createdAt,
    });
  });

  it('should create a stock with all optional fields', async () => {
    // ARRANGE
    const createDto = {
      name: 'guaranteed',
      stockTypeId: 'st-1',
      value: 150,
      monthlyContribution: 75,
      isGuaranteed: true,
      guaranteedYield: 0.02,
      behavior: StockBehavior.DIVIDEND_YIELD,
    };

    stockRepository.findByType.mockResolvedValue(null);
    const savedStock = Stock.create(createDto);
    stockRepository.save.mockResolvedValue(savedStock);

    // ACT
    const result = await useCase.execute(createDto);

    // ASSERT
    expect(result.name).toBe('guaranteed');
    expect(result.type).toBe('guaranteed');
    expect(result.stockTypeId).toBe('st-1');
    expect(result.value).toBe(150);
    expect(result.monthlyContribution).toBe(75);
    expect(result.isGuaranteed).toBe(true);
    expect(result.guaranteedYield).toBe(0.02);
    expect(result.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
  });

  it('should throw InvalidRequestError if stock name already exists', async () => {
    // ARRANGE
    const createDto = {
      type: 'preferential',
      value: 100,
      monthlyContribution: 50,
    };

    const existingStock = Stock.create(createDto);
    stockRepository.findByType.mockResolvedValue(existingStock);

    // ACT & ASSERT
    await expect(useCase.execute(createDto)).rejects.toThrow(
      InvalidRequestError,
    );
    await expect(useCase.execute(createDto)).rejects.toThrow(
      'Stock with name "preferential" already exists',
    );

    expect(findByTypeSpy).toHaveBeenCalledWith('preferential');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should allow creating stock with same type if existing is deleted', async () => {
    // ARRANGE
    const createDto = {
      type: 'preferential',
      value: 100,
      monthlyContribution: 50,
    };

    const deletedStock = Stock.create(createDto);
    deletedStock.markAsDeleted();
    stockRepository.findByType.mockResolvedValue(deletedStock);

    const newStock = Stock.create(createDto);
    stockRepository.save.mockResolvedValue(newStock);

    // ACT
    const result = await useCase.execute(createDto);

    // ASSERT
    expect(result).toBeDefined();
    expect(findByTypeSpy).toHaveBeenCalledWith('preferential');
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('preferential');
  });
});
