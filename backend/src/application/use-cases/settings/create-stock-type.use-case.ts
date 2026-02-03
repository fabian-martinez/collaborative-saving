import { randomUUID } from 'crypto';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/entities/stock.entity';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

export interface CreateStockTypeCommand {
  name: string;
  behavior: StockBehavior;
  isGuaranteed: boolean;
  guaranteedYield: number | null;
}

export class CreateStockTypeUseCase {
  constructor(private readonly stockTypeRepo: StockTypeRepository) {}

  async execute(command: CreateStockTypeCommand): Promise<StockType> {
    const stockType = StockType.create({
      id: randomUUID(),
      name: command.name,
      behavior: command.behavior,
      isGuaranteed: command.isGuaranteed,
      guaranteedYield: command.guaranteedYield,
    });
    return this.stockTypeRepo.save(stockType);
  }
}
