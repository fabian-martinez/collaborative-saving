import { ConflictException } from '@nestjs/common';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';

export class DeleteStockTypeUseCase {
  constructor(
    private readonly stockTypeRepo: StockTypeRepository,
    private readonly stockRepo: StockRepository,
    private readonly configRepo: InterestDistributionConfigRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const stockCount = await this.stockRepo.countByStockType(id);
    if (stockCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el tipo de acción porque está siendo utilizado por ${stockCount} acciones existentes.`,
      );
    }

    const configs = await this.configRepo.findByStockType(id);
    if (configs.length > 0) {
      throw new ConflictException(
        `No se puede eliminar el tipo de acción porque está configurado en una regla de distribución de intereses.`,
      );
    }

    await this.stockTypeRepo.delete(id);
  }
}
