import { ApiProperty } from '@nestjs/swagger';

/**
 * Stock Loan Payment Response HTTP DTO
 *
 * HTTP response DTO for a stock loan payment operation.
 */
export class StockLoanPaymentResponseHttpDto {
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
  payment_value: number;

  @ApiProperty()
  loan_id: string;

  @ApiProperty()
  loan_type: string;

  @ApiProperty()
  previous_balance: number;

  @ApiProperty()
  new_balance: number;

  @ApiProperty()
  subscription_id: string;

  @ApiProperty()
  transaction_detail_id: string;
}
