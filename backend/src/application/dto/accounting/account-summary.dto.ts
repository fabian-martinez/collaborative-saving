import { AccountType } from '@domain/constants/account-types';
import { AccountLedgerEntryDto } from './account-ledger-entry.dto';

export class AccountSummaryDto {
  accountType: AccountType;
  accountName?: string;
  totalBalance: number;
  totalDebits: number;
  totalCredits: number;
  entriesCount: number;
  entries: AccountLedgerEntryDto[];
  hasMoreEntries: boolean;
}

