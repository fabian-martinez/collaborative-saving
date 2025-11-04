import { CreateStockDto } from '@application/dto/stocks/create-stock.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { Stock } from '@domain/entities/stock.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class CreateStockUseCase {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(dto: CreateStockDto): Promise<StockResponseDto> {
    // Validar que no exista un stock con el mismo tipo
    const existing = await this.stockRepository.findByType(dto.type);
    if (existing && !existing.isDeleted()) {
      throw new InvalidRequestError(
        `Stock with type "${dto.type}" already exists`,
      );
    }

    const stock = Stock.create({
      type: dto.type,
      value: dto.value,
      monthlyContribution: dto.monthlyContribution,
      isGuaranteed: dto.isGuaranteed,
      guaranteedYield: dto.guaranteedYield,
      behavior: dto.behavior,
    });

    const saved = await this.stockRepository.save(stock);

    return {
      id: saved.id,
      type: saved.type,
      value: saved.value,
      monthlyContribution: saved.monthlyContribution,
      isGuaranteed: saved.isGuaranteed,
      guaranteedYield: saved.guaranteedYield,
      behavior: saved.behavior,
      createdAt: saved.createdAt,
    };
  }
}
