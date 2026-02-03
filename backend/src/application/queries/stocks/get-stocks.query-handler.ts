import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';

export class GetStocksQueryHandler {
  constructor(
    private readonly stockRepository: StockRepository, 
    private readonly stockTypeRepository: StockTypeRepository
  ) {}

  async execute(): Promise<StockResponseDto[]> {
    const stocks = await this.stockRepository.findActive();
    return Promise.all(stocks.map(async (s) => ({
      id: s.id,
      name: s.name,
      value: s.value,
      monthlyContribution: s.monthlyContribution,
      stockType: (await this.stockTypeRepository.findByStockId(s.id))!,
      createdAt: s.createdAt,
    })));
  }
}
