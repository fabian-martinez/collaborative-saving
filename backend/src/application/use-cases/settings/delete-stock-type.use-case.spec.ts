import { DeleteStockTypeUseCase } from './delete-stock-type.use-case';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

describe('DeleteStockTypeUseCase', () => {
  let useCase: DeleteStockTypeUseCase;
  let stockTypeRepository: jest.Mocked<StockTypeRepository>;

  beforeEach(() => {
    stockTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<StockTypeRepository>;

    useCase = new DeleteStockTypeUseCase(stockTypeRepository);
  });

  it('should delete a stock type by id', async () => {
    const id = 'stock-1';
    stockTypeRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(id);

    expect(stockTypeRepository.delete).toHaveBeenCalledWith(id);
  });
});
