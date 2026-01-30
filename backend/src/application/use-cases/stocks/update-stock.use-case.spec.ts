import { UpdateStockUseCase } from './update-stock.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('UpdateStockUseCase', () => {
  let useCase: UpdateStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let findByIdSpy: jest.SpyInstance;
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

    // Create spies to avoid 'this' scoping issues
    findByIdSpy = jest.spyOn(stockRepository, 'findById');
    findByNameSpy = jest.spyOn(stockRepository, 'findByName');
    saveSpy = jest.spyOn(stockRepository, 'save');

    useCase = new UpdateStockUseCase(stockRepository);
  });

  it('should update a stock successfully', async () => {
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    const existingStock = Stock.create({
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
    });

    const updateDto = {
      value: 150,
      monthlyContribution: 75,
    };

    stockRepository.findById.mockResolvedValue(existingStock);
    // Simulate updated stock by updating existing and cloning
    existingStock.update({ value: 150, monthlyContribution: 75 });
    stockRepository.save.mockResolvedValue(existingStock);

    const result = await useCase.execute(stockId, updateDto);

    expect(findByIdSpy).toHaveBeenCalledWith(stockId);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.value).toBe(150);
    expect(result.monthlyContribution).toBe(75);
  });

  it('should throw StockNotFoundException if stock does not exist', async () => {
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    stockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(stockId, { value: 150 })).rejects.toThrow(
      StockNotFoundException,
    );
    await expect(useCase.execute(stockId, { value: 150 })).rejects.toThrow(
      `Stock with ID ${stockId} not found`,
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should throw InvalidRequestError if stock is deleted', async () => {
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    const deletedStock = Stock.create({
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
    });
    deletedStock.markAsDeleted();

    stockRepository.findById.mockResolvedValue(deletedStock);

    await expect(useCase.execute(stockId, { value: 150 })).rejects.toThrow(
      InvalidRequestError,
    );
    await expect(useCase.execute(stockId, { value: 150 })).rejects.toThrow(
      `Stock with ID ${stockId} is deleted`,
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should throw InvalidRequestError if new name already exists', async () => {
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    const existingStock = Stock.create({
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
    });

    const otherStock = Stock.create({
      name: 'new-name',
      value: 200,
      monthlyContribution: 100,
    });

    stockRepository.findById.mockResolvedValue(existingStock);
    stockRepository.findByName.mockResolvedValue(otherStock);

    await expect(
      useCase.execute(stockId, { name: 'new-name' }),
    ).rejects.toThrow(InvalidRequestError);
    await expect(
      useCase.execute(stockId, { name: 'new-name' }),
    ).rejects.toThrow('Stock with name "new-name" already exists');

    expect(findByNameSpy).toHaveBeenCalledWith('new-name');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should allow updating name to same value', async () => {
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    const existingStock = Stock.create({
      name: 'preferential',
      value: 100,
      monthlyContribution: 50,
    });

    stockRepository.findById.mockResolvedValue(existingStock);
    stockRepository.save.mockResolvedValue(existingStock);

    const result = await useCase.execute(stockId, {
      name: 'preferential',
      value: 150,
    });

    expect(result).toBeDefined();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should update stock basics correctly', async () => {
    const stockId = '550e8400-e29b-41d4-a716-446655440000';
    const existingStock = Stock.create({
      name: 'test',
      value: 100,
      monthlyContribution: 50,
    });

    stockRepository.findById.mockResolvedValue(existingStock);
    existingStock.update({ value: 120 });
    stockRepository.save.mockResolvedValue(existingStock);

    const result = await useCase.execute(stockId, {
      value: 120,
    });

    expect(result.value).toBe(120);
  });
});
