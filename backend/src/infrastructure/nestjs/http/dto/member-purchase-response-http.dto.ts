import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * HTTP Response DTO for Member Purchase
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class MemberPurchaseResponseHttpDto {
  @ApiProperty({
    description: 'The unique identifier of the stock subscription',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  stock_subscription_id: string;

  @ApiProperty({
    description: 'The unique identifier of the stock',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  stock_id: string;

  @ApiProperty({
    description: 'The name of the stock',
    example: 'Acción A',
  })
  stock_name: string;

  @ApiProperty({
    description: 'The quantity of stocks purchased',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'The unit value of the stock at the time of purchase',
    example: 100000,
  })
  unit_value: number;

  @ApiProperty({
    description: 'The total value of the purchase',
    example: 200000,
  })
  total_value: number;

  @ApiProperty({
    description: 'The date of the purchase',
    example: '2024-01-15',
  })
  purchase_date: Date | string;

  @ApiProperty({
    description:
      'The unique identifier of the meeting where the purchase was made',
    example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  meeting_id: string;

  @ApiProperty({
    description: 'The unique identifier of the accounting operation',
    example: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  operation_id: string;

  @ApiPropertyOptional({
    description: 'Loan information if the purchase was financed',
    nullable: true,
  })
  loan?: {
    loan_id: string;
    approved_amount: number;
    interest_rate: number;
    status: string;
  } | null;
}
