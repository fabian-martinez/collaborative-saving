import { OperationType } from '@domain/enums/operation-type.enum';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';

export interface OperationResponseDto {
  id: string;
  memberId: string | null;
  meetingId: string;
  type: OperationType;
  date: Date;
  description?: string | null;
  totalAmount?: number;
  entries?: LedgerEntryResponseDto[];
}
