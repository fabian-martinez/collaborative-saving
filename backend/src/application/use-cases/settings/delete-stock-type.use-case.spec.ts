import { DeleteStockTypeUseCase } from './delete-stock-type.use-case';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { ConflictException } from '@nestjs/common';

describe('DeleteStockTypeUseCase', () => {
  let useCase: DeleteStockTypeUseCase;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let configRepository: jest.Mocked<InterestDistributionConfigRepository>;

  beforeEach(() => {
    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;

    stockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByType: jest.fn(),
      findActive: jest.fn(),
      findGuaranteed: jest.fn(),
      save: jest.fn(),
      countByStockType: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    configRepository = {
      findAll: jest.fn(),
      findByLoanType: jest.fn(),
      findByStockType: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InterestDistributionConfigRepository>;

    useCase = new DeleteStockTypeUseCase(stockTypeRepository, stockRepository, configRepository);
  });

  it('should delete a stock type by id if not in use', async () => {
    const id = 'stock-1';
    stockRepository.countByStockType.mockResolvedValue(0);
    configRepository.findByStockType.mockResolvedValue([]);
    stockTypeRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(id);

    expect(stockRepository.countByStockType).toHaveBeenCalledWith(id);
    expect(configRepository.findByStockType).toHaveBeenCalledWith(id);
    expect(stockTypeRepository.delete).toHaveBeenCalledWith(id);
  });

  it('should throw ConflictException if stock type is in use by stocks', async () => {
    const id = 'stock-1';
    stockRepository.countByStockType.mockResolvedValue(5);

    await expect(useCase.execute(id)).rejects.toThrow(ConflictException);
    expect(stockTypeRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if stock type is in use by config', async () => {
    const id = 'stock-1';
    stockRepository.countByStockType.mockResolvedValue(0);
    configRepository.findByStockType.mockResolvedValue([{ id: 'config-1' } as any]);

    await expect(useCase.execute(id)).rejects.toThrow(ConflictException);
    expect(stockTypeRepository.delete).not.toHaveBeenCalled();
  });
});
