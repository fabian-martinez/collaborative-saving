import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberPaymentEntryHttpDto } from './member-payment-entry-http.dto';

/**
 * HTTP Response DTO for Member Payment
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class MemberPaymentResponseHttpDto {
  @ApiProperty()
  operation_id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  total_amount: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  date: Date | string;

  @ApiProperty()
  meeting_id: string;

  @ApiProperty({ type: [MemberPaymentEntryHttpDto] })
  entries: MemberPaymentEntryHttpDto[];
}
