import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';

export class GetStocksQueryHandler {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(): Promise<StockResponseDto[]> {
    const stocks = await this.stockRepository.findActive();
    return stocks.map((s) => ({
      id: s.id,
      type: s.type,
      value: s.value,
      monthlyContribution: s.monthlyContribution,
      isGuaranteed: s.isGuaranteed,
      guaranteedYield: s.guaranteedYield,
      behavior: s.behavior,
      createdAt: s.createdAt,
    }));
  }
}
