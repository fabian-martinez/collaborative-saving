/**
 * Record Operation DTO
 *
 * Input DTO for recording an accounting operation with its ledger entries.
 * This DTO represents the data needed to create an operation and its associated
 * double-entry bookkeeping entries.
 */
export interface LedgerEntryDto {
  accountType: string;
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
  type: string;
  description?: string;
  date?: Date;
  entries: LedgerEntryDto[];
}
