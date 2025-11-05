import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * HTTP Response DTO for Member Payment Entry
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class MemberPaymentEntryHttpDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  account_type: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  loan_id?: string;

  @ApiPropertyOptional()
  stock_id?: string;

  @ApiPropertyOptional()
  mandatory_contribution_id?: string;

  @ApiPropertyOptional()
  stock_subscription_id?: string;
}
