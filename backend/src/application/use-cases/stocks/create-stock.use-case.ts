import { CreateStockDto } from '@application/dto/stocks/create-stock.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { Stock } from '@domain/entities/stock.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

export class CreateStockUseCase {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockTypeRepository: StockTypeRepository,
  ) {}

  async execute(dto: CreateStockDto): Promise<StockResponseDto> {
    // Validar que no exista un stock con el mismo nombre
    const existing = await this.stockRepository.findByName(dto.name);
    if (existing && !existing.isDeleted()) {
      throw new InvalidRequestError(
        `Stock with name "${dto.name}" already exists`,
      );
    }
    const stockType = await this.stockTypeRepository.findByStockId(dto.stockTypeId!);
    if (!stockType) {
      throw new InvalidRequestError(
        `StockType with ID "${dto.stockTypeId}" not found`,
      );
    }

    const stock = Stock.create({
      name: dto.name,
      value: dto.value,
      monthlyContribution: dto.monthlyContribution,
      stockTypeId: stockType.id,
      createdAt: dto.createdAt,
    });

    const saved = await this.stockRepository.save(stock);

    return {
      id: saved.id,
      name: saved.name,
      value: saved.value,
      monthlyContribution: saved.monthlyContribution,
      stockType,
      createdAt: saved.createdAt,
    };
  }
}
