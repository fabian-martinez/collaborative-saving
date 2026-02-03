import { UpdateStockTypeUseCase, UpdateStockTypeCommand } from './update-stock-type.use-case';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/entities/stock.entity';
import { NotFoundException } from '@nestjs/common';

describe('UpdateStockTypeUseCase', () => {
  let useCase: UpdateStockTypeUseCase;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;

  beforeEach(() => {
    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;

    useCase = new UpdateStockTypeUseCase(stockTypeRepository);
  });

  it('should update and save an existing stock type', async () => {
    const existingStockType = StockType.create({
      id: 'stock-1',
      name: 'Original Name',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
      guaranteedYield: null,
      isGuaranteed: false,
    });

    const command: UpdateStockTypeCommand = {
      id: 'stock-1',
      name: 'Updated Name',
      behavior: StockBehavior.DIVIDEND_YIELD,
      guaranteedYield: 0.02,
      isGuaranteed: true,
    };

    stockTypeRepository.findById.mockResolvedValue(existingStockType);
    stockTypeRepository.save.mockImplementation((st) => Promise.resolve(st));

    const result = await useCase.execute(command);

    expect(stockTypeRepository.findById).toHaveBeenCalledWith('stock-1');
    expect(stockTypeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'stock-1',
        name: 'Updated Name',
        behavior: StockBehavior.DIVIDEND_YIELD,
        guaranteedYield: 0.02,
        isGuaranteed: true,
      })
    );
    expect(result.name).toBe('Updated Name');
    expect(result.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
    expect(result.guaranteedYield).toBe(0.02);
    expect(result.isGuaranteed).toBe(true);
  });

  it('should throw NotFoundException if stock type does not exist', async () => {
    stockTypeRepository.findById.mockResolvedValue(null);

    const command: UpdateStockTypeCommand = {
      id: 'non-existent',
      name: 'Updated Name',
      behavior: StockBehavior.DIVIDEND_YIELD,
      guaranteedYield: 0.02,
      isGuaranteed: true,
    };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
  });
});
