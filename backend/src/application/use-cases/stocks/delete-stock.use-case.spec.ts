import { Test, TestingModule } from '@nestjs/testing';
import { DeleteStockUseCase } from './delete-stock.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { Stock } from '@domain/entities/stock.entity';
import { StockSubscription, StockSubscriptionStatus } from '@domain/entities/stock-subscription.entity';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('DeleteStockUseCase', () => {
  let useCase: DeleteStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;

  beforeEach(async () => {
    const mockStockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockStockSubscriptionRepository = {
      findByStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteStockUseCase,
        {
          provide: 'StockRepository',
          useValue: mockStockRepository,
        },
        {
          provide: 'StockSubscriptionRepository',
          useValue: mockStockSubscriptionRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteStockUseCase>(DeleteStockUseCase);
    stockRepository = module.get('StockRepository');
    stockSubscriptionRepository = module.get('StockSubscriptionRepository');

    // Manual injection adjust
    (useCase as any).stockRepository = stockRepository;
    (useCase as any).stockSubscriptionRepository = stockSubscriptionRepository;
  });

  it('should soft delete a stock', async () => {
    // Arrange
    const stockId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const stock = Stock.create({
      name: 'Acción A',
      value: 100000,
      monthlyContribution: 50000,
      stockTypeId: 'type-id-123',
    });
    
    stockRepository.findById.mockResolvedValue(stock);
    stockRepository.save.mockResolvedValue(stock);
    stockSubscriptionRepository.findByStock.mockResolvedValue([]);

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
      stockTypeId: 'type-id-123',
    });
    stock.markAsDeleted();
    
    stockRepository.findById.mockResolvedValue(stock);

    // Act & Assert
    await expect(useCase.execute(stockId)).rejects.toThrow(
      `Stock with ID ${stockId} is already deleted`,
    );
  });

  it('should throw InvalidRequestError if stock has active subscriptions', async () => {
    // Arrange
    const stockId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const stock = Stock.create({
      name: 'Acción A',
      value: 100000,
      monthlyContribution: 50000,
      stockTypeId: 'type-id-123',
    });
    
    const subscription = StockSubscription.create({
      memberId: 'member-1',
      stockId: stockId,
      quantity: 1,
    });
    
    stockRepository.findById.mockResolvedValue(stock);
    stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);

    // Act & Assert
    await expect(useCase.execute(stockId)).rejects.toThrow(
      `Cannot delete stock with ID ${stockId} because it has active subscriptions or quantity greater than 0`,
    );
  });

  it('should throw InvalidRequestError if stock has subscriptions with quantity > 0 even if inactive', async () => {
    // Arrange
    const stockId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const stock = Stock.create({
      name: 'Acción A',
      value: 100000,
      monthlyContribution: 50000,
      stockTypeId: 'type-id-123',
    });
    
    // Create an "inactive" subscription but with quantity > 0 (manually setting it for testing)
    const subscription = StockSubscription.fromPersistence({
      id: 'sub-1',
      member_id: 'member-1',
      stock_id: stockId,
      quantity: 5,
      status: StockSubscriptionStatus.INACTIVE,
      purchase_date: new Date(),
    });
    
    stockRepository.findById.mockResolvedValue(stock);
    stockSubscriptionRepository.findByStock.mockResolvedValue([subscription]);

    // Act & Assert
    await expect(useCase.execute(stockId)).rejects.toThrow(
      `Cannot delete stock with ID ${stockId} because it has active subscriptions or quantity greater than 0`,
    );
  });
});
