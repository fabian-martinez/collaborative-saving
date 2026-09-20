import { ApiProperty } from '@nestjs/swagger';
import { OperationType } from '@domain/enums/operation-type.enum';
import { LedgerEntryResponseHttpDto } from './ledger-entry-response-http.dto';

/**
 * HTTP Response DTO for Operation
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class OperationResponseHttpDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  member_id: string | null;

  @ApiProperty()
  meeting_id: string;

  @ApiProperty({ enum: OperationType })
  type: OperationType;

  @ApiProperty()
  date: Date;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Total payment amount calculated from CASH_ACCOUNT entries',
    example: 250000,
  })
  total_amount: number;

  @ApiProperty({
    description: 'Ledger entries associated with this operation',
    type: [LedgerEntryResponseHttpDto],
    required: false,
  })
  entries?: LedgerEntryResponseHttpDto[];

  @ApiProperty({
    description: 'Alias for entries to support frontend components expecting ledger_entries',
    type: [LedgerEntryResponseHttpDto],
    required: false,
  })
  ledger_entries?: LedgerEntryResponseHttpDto[];
}
