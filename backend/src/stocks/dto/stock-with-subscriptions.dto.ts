import { ApiProperty } from '@nestjs/swagger';
import { Stock } from '../entities/stock.entity';

export class StockWithSubscriptionsDto extends Stock {
  @ApiProperty({
    description: 'The number of active subscriptions for this stock',
    example: 15,
    type: 'number',
  })
  subscriptionCount: number;
}
