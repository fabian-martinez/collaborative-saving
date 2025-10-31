import { UpdateStockDto } from '@application/dto/stocks/update-stock.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

export class UpdateStockUseCase {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(
    stockId: string,
    dto: UpdateStockDto,
  ): Promise<StockResponseDto> {
    const stock = await this.stockRepository.findById(stockId);

    if (!stock) {
      throw new NotFoundException(`Stock with ID ${stockId} not found`);
    }

    if (stock.isDeleted()) {
      throw new BadRequestException(`Stock with ID ${stockId} is deleted`);
    }

    // Si se está actualizando el tipo, verificar que no exista otro stock con el mismo tipo
    if (dto.type && dto.type !== stock.type) {
      const existing = await this.stockRepository.findByType(dto.type);
      if (existing && existing.id !== stockId && !existing.isDeleted()) {
        throw new BadRequestException(
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
