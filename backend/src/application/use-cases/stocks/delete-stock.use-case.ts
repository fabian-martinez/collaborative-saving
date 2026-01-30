import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class DeleteStockUseCase {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(id: string): Promise<void> {
    const stock = await this.stockRepository.findById(id);

    if (!stock) {
      throw new StockNotFoundException(id);
    }

    if (stock.isDeleted()) {
      throw new InvalidRequestError(`Stock with ID ${id} is already deleted`);
    }

    stock.markAsDeleted();
    await this.stockRepository.save(stock);
  }
}
