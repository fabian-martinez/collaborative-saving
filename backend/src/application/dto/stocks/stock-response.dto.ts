import { StockTypeResponseDto } from '../stock-type/stock-type-response.dto';

export class StockResponseDto {
  id: string;
  name: string;
  value: number;
  monthlyContribution: number;
  createdAt: Date;
  stockType: StockTypeResponseDto;
}
