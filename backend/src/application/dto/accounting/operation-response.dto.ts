import { OperationType } from '@domain/enums/operation-type.enum';
import { LedgerEntryResponseDto } from './ledger-entry-response.dto';

export class OperationResponseDto {
  id: string;
  memberId: string | null;
  meetingId: string;
  type: OperationType;
  date: Date;
  description: string | null;
  entries: LedgerEntryResponseDto[];
}
