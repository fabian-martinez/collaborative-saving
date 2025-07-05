import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class CreateStockSubscriptionDto {
  @ApiProperty({
    description: 'The ID of the member subscribing to the stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  member_id: string;

  @ApiProperty({
    description: 'The ID of the stock type being subscribed to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  stock_id: string;

  @ApiProperty({
    description: 'The number of stock units to subscribe to',
    example: 5,
  })
  @IsInt()
  @IsPositive()
  quantity: number;
}
