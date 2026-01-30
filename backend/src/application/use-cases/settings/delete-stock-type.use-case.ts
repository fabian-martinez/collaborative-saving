import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

export class DeleteStockTypeUseCase {
  constructor(private readonly stockTypeRepo: StockTypeRepository) {}

  async execute(id: string): Promise<void> {
    await this.stockTypeRepo.delete(id);
  }
}
