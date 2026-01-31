import { Test, TestingModule } from '@nestjs/testing';
import { DeleteStockUseCase } from './delete-stock.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Stock } from '@domain/entities/stock.entity';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('DeleteStockUseCase', () => {
  let useCase: DeleteStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;

  beforeEach(async () => {
    const mockStockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteStockUseCase,
        {
          provide: 'StockRepository', // Using string because we'll inject it via STOCK_REPOSITORY symbol in module
          useValue: mockStockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteStockUseCase>(DeleteStockUseCase);
    stockRepository = module.get('StockRepository');
    
    // Manual injection adjust since we don't use Symbol tokens in unit tests usually
    (useCase as any).stockRepository = stockRepository;
  });

  it('should soft delete a stock', async () => {
    // Arrange
    const stockId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const stock = Stock.create({
      name: 'Acción A',
      value: 100000,
      monthlyContribution: 50000,
    });
    
    stockRepository.findById.mockResolvedValue(stock);
    stockRepository.save.mockResolvedValue(stock);

    // Act
    await useCase.execute(stockId);

    // Assert
    expect(stockRepository.findById).toHaveBeenCalledWith(stockId);
    expect(stock.isDeleted()).toBe(true);
    expect(stockRepository.save).toHaveBeenCalledWith(stock);
  });

  it('should throw StockNotFoundException if stock does not exist', async () => {
    // Arrange
    const stockId = 'non-existent-id';
    stockRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(stockId)).rejects.toThrow(StockNotFoundException);
  });

  it('should throw InvalidRequestError if stock is already deleted', async () => {
    // Arrange
    const stockId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const stock = Stock.create({
      name: 'Acción A',
      value: 100000,
      monthlyContribution: 50000,
    });
    stock.markAsDeleted();
    
    stockRepository.findById.mockResolvedValue(stock);

    // Act & Assert
    await expect(useCase.execute(stockId)).rejects.toThrow(
      `Stock with ID ${stockId} is already deleted`,
    );
  });
});
