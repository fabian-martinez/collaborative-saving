import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Purchase Stock Response HTTP DTO
 *
 * HTTP response DTO for stock purchase.
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class PurchaseStockResponseHttpDto {
  @ApiProperty({
    description:
      'The unique identifier of the operation created for the stock purchase',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  operation_id: string;

  @ApiProperty({
    description:
      'The unique identifier of the meeting where the purchase was made',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  meeting_id: string;

  @ApiProperty({
    description: 'The unique identifier of the member who purchased the stocks',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  member_id: string;

  @ApiProperty({
    description: 'The unique identifier of the stock subscription created',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  stock_subscription_id: string;

  @ApiPropertyOptional({
    description:
      'The unique identifier of the loan created if financing was used',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  loan_id?: string | null;
}
