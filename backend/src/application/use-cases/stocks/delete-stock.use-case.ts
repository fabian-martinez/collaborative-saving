import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class DeleteStockUseCase {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const stock = await this.stockRepository.findById(id);

    if (!stock) {
      throw new StockNotFoundException(id);
    }

    if (stock.isDeleted()) {
      throw new InvalidRequestError(`Stock with ID ${id} is already deleted`);
    }

    const subscriptions = await this.stockSubscriptionRepository.findByStock(id);
    const hasActiveSubscriptions = subscriptions.some(
      (s) => s.isActive() || s.quantity > 0,
    );

    if (hasActiveSubscriptions) {
      throw new InvalidRequestError(
        `Cannot delete stock with ID ${id} because it has active subscriptions or quantity greater than 0`,
      );
    }

    stock.markAsDeleted();
    await this.stockRepository.save(stock);
  }
}
