import { ApiProperty } from '@nestjs/swagger';

/**
 * Stock Transfer Response HTTP DTO
 *
 * HTTP response DTO for a stock transfer operation.
 */
export class StockTransferResponseHttpDto {
  @ApiProperty()
  operation_id: string;

  @ApiProperty()
  meeting_id: string;

  @ApiProperty()
  date: Date | string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  stock_id: string;

  @ApiProperty()
  stock_name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  value: number;

  @ApiProperty()
  from_member_id: string;

  @ApiProperty()
  from_member_name: string;

  @ApiProperty()
  to_member_id: string;

  @ApiProperty()
  to_member_name: string;

  @ApiProperty()
  from_subscription_id: string;

  @ApiProperty()
  to_subscription_id: string;
}
