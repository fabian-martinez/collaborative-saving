import { AccountType } from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

/**
 * Record Operation DTO
 *
 * Input DTO for recording an accounting operation with its ledger entries.
 * This DTO represents the data needed to create an operation and its associated
 * double-entry bookkeeping entries.
 */
export interface LedgerEntryDto {
  accountType: AccountType;
  amount: number;
  description?: string | null;
  loanId?: string | null;
  stockId?: string | null;
  mandatoryContributionId?: string | null;
  stockSubscriptionId?: string | null;
}

export interface RecordOperationDto {
  memberId?: string | null;
  meetingId: string;
  type: OperationType;
  description?: string;
  date?: Date;
  entries: LedgerEntryDto[];
}
