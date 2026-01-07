import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * HTTP Response DTO for Stock Subscription
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class StockSubscriptionResponseHttpDto {
  @ApiProperty({
    description: 'The unique identifier of the stock subscription',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The unique identifier of the stock',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  stock_id: string;

  @ApiProperty({
    description: 'The type of stock',
    example: 'Acción A',
  })
  stock_type: string;

  @ApiProperty({
    description: 'The quantity of stocks in this subscription',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'The date when the stock subscription was purchased',
    example: '2024-01-15',
  })
  purchase_date: Date | string;

  @ApiProperty({
    description: 'The status of the stock subscription',
    example: 'active',
    enum: ['pending', 'active', 'inactive'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'The unique identifier of the financing loan, if applicable',
    nullable: true,
    example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  financing_loan_id?: string | null;
}
