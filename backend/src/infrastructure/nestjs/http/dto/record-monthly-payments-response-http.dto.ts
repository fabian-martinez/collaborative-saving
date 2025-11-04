import { ApiProperty } from '@nestjs/swagger';

/**
 * HTTP Response DTO for Record Monthly Payments
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class RecordMonthlyPaymentsResponseHttpDto {
  @ApiProperty()
  operation_id: string;

  @ApiProperty()
  meeting_id: string;

  @ApiProperty()
  member_id: string;

  @ApiProperty()
  total_amount: number;

  @ApiProperty({ type: [String] })
  ledger_entry_ids: string[];
}
