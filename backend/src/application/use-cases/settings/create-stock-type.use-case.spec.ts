import { CreateStockTypeUseCase, CreateStockTypeCommand } from './create-stock-type.use-case';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/entities/stock.entity';

describe('CreateStockTypeUseCase', () => {
  let useCase: CreateStockTypeUseCase;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;

  beforeEach(() => {
    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;

    useCase = new CreateStockTypeUseCase(stockTypeRepository);
  });

  it('should create and save a new stock type', async () => {
    const command: CreateStockTypeCommand = {
      name: 'Test Stock Type',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    };

    const savedStockType = StockType.create({
      id: 'generated-uuid',
      ...command,
    });

    stockTypeRepository.save.mockResolvedValue(savedStockType);

    const result = await useCase.execute(command);

    expect(stockTypeRepository.save).toHaveBeenCalledTimes(1);
    expect(stockTypeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: command.name,
        behavior: command.behavior,
      })
    );
    expect(result).toEqual(savedStockType);
  });
});
