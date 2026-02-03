import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

export class GetStockDetailQueryHandler {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockTypeRepository: StockTypeRepository,
  ) {}

  async execute(stockId: string): Promise<StockResponseDto> {
    const stock = await this.stockRepository.findById(stockId);
    const stockType = await this.stockTypeRepository.findByStockId(stockId);
    if (!stock) {
      throw new StockNotFoundException(stockId);
    }
    if (!stockType) {
      throw new StockTypeNotFoundException(stockId);
    }
    return {
      id: stock.id,
      name: stock.name,
      value: stock.value,
      monthlyContribution: stock.monthlyContribution,
      createdAt: stock.createdAt,
      stockType,
    };
  }
}
