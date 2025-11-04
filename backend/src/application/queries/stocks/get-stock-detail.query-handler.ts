import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';

export class GetStockDetailQueryHandler {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(stockId: string): Promise<StockResponseDto> {
    const stock = await this.stockRepository.findById(stockId);
    if (!stock) {
      throw new StockNotFoundException(stockId);
    }
    return {
      id: stock.id,
      type: stock.type,
      value: stock.value,
      monthlyContribution: stock.monthlyContribution,
      isGuaranteed: stock.isGuaranteed,
      guaranteedYield: stock.guaranteedYield,
      behavior: stock.behavior,
      createdAt: stock.createdAt,
    };
  }
}
