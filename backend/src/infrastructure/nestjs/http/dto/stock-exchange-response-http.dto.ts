import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Stock Exchange Response HTTP DTO
 *
 * HTTP response DTO for a stock exchange operation.
 */
export class StockExchangeResponseHttpDto {
  @ApiProperty()
  operation_id: string;

  @ApiProperty()
  meeting_id: string;

  @ApiProperty()
  date: Date | string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  from_stock_id: string;

  @ApiProperty()
  from_stock_type: string;

  @ApiProperty()
  from_quantity: number;

  @ApiProperty()
  from_value: number;

  @ApiProperty()
  to_stock_id: string;

  @ApiProperty()
  to_stock_type: string;

  @ApiProperty()
  to_quantity: number;

  @ApiProperty()
  to_value: number;

  @ApiProperty()
  difference: number;

  @ApiPropertyOptional()
  difference_handling?: 'cash' | 'credit';

  @ApiProperty()
  from_subscription_id: string;

  @ApiProperty()
  to_subscription_id: string;

  @ApiPropertyOptional({ nullable: true })
  pending_payment_id?: string | null;

  @ApiPropertyOptional({ nullable: true })
  loan_id?: string | null;
}
