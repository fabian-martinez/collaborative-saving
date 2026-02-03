import { NotFoundException } from '@nestjs/common';
import { StockType } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/entities/stock.entity';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

export interface UpdateStockTypeCommand {
  id: string;
  name?: string;
  behavior?: StockBehavior;
  guaranteedYield?: number | null;
  isGuaranteed?: boolean;
}

export class UpdateStockTypeUseCase {
  constructor(private readonly stockTypeRepo: StockTypeRepository) {}

  async execute(command: UpdateStockTypeCommand): Promise<StockType> {
    const existing = await this.stockTypeRepo.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`StockType with ID ${command.id} not found`);
    }

    const updated = StockType.create({
      id: existing.id,
      name: command.name ?? existing.name,
      behavior: command.behavior ?? existing.behavior,
      guaranteedYield: command.guaranteedYield ?? existing.guaranteedYield,
      isGuaranteed: command.isGuaranteed ?? existing.isGuaranteed,
    });

    return this.stockTypeRepo.save(updated);
  }
}
