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

    // Si se está actualizando el nombre, verificar que no exista otro stock con el mismo nombre
    if (dto.name && dto.name !== stock.name) {
      const existing = await this.stockRepository.findByName(dto.name);
      if (existing && existing.id !== stockId && !existing.isDeleted()) {
        throw new InvalidRequestError(
          `Stock with name "${dto.name}" already exists`,
        );
      }
    }

    stock.update({
      name: dto.name,
      value: dto.value,
      monthlyContribution: dto.monthlyContribution,
      isGuaranteed: dto.isGuaranteed,
      guaranteedYield: dto.guaranteedYield,
      stockTypeId: dto.stockTypeId,
    });

    const saved = await this.stockRepository.save(stock);

    return {
      id: saved.id,
      name: saved.name,
      value: saved.value,
      monthlyContribution: saved.monthlyContribution,
      isGuaranteed: saved.isGuaranteed,
      guaranteedYield: saved.guaranteedYield,
      createdAt: saved.createdAt,
    };
  }
}
