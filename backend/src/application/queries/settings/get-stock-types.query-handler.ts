import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType } from '@domain/entities/stock-type.entity';

export class GetStockTypesQueryHandler {
  constructor(private readonly stockTypeRepo: StockTypeRepository) {}

  async execute(): Promise<StockType[]> {
    return this.stockTypeRepo.findAll();
  }
}
