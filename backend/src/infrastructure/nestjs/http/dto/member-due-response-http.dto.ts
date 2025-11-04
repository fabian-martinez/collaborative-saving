import { ApiProperty } from '@nestjs/swagger';

export class MemberDueDetailsHttpDto {
  @ApiProperty()
  interest: number;

  @ApiProperty()
  principal: number;

  @ApiProperty()
  outstanding_balance: number;
}

/**
 * HTTP Response DTO for Member Due
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class MemberDueResponseHttpDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  reference_id?: string;

  @ApiProperty({ required: false, type: MemberDueDetailsHttpDto })
  details?: MemberDueDetailsHttpDto;

  @ApiProperty({ required: false })
  monthly_contribution?: number;

  @ApiProperty({ required: false })
  stock_quantity?: number;

  @ApiProperty({ required: false })
  novelty_comment?: string;

  @ApiProperty({ required: false })
  creation_date?: string;
}
