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
    description: 'Ledger entries associated with this operation',
    type: [LedgerEntryResponseHttpDto],
  })
  entries: LedgerEntryResponseHttpDto[];
}
