import { UpdateStockDto } from '@application/dto/stocks/update-stock.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class UpdateStockUseCase {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(
    stockId: string,
    dto: UpdateStockDto,
  ): Promise<StockResponseDto> {
    const stock = await this.stockRepository.findById(stockId);

    if (!stock) {
      throw new StockNotFoundException(stockId);
    }

    if (stock.isDeleted()) {
      throw new InvalidRequestError(`Stock with ID ${stockId} is deleted`);
    }

    // Si se está actualizando el tipo, verificar que no exista otro stock con el mismo tipo
    if (dto.type && dto.type !== stock.type) {
      const existing = await this.stockRepository.findByType(dto.type);
      if (existing && existing.id !== stockId && !existing.isDeleted()) {
        throw new InvalidRequestError(
          `Stock with type "${dto.type}" already exists`,
        );
      }
    }

    stock.update({
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
