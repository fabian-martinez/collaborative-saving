import { LedgerEntry } from '../../entities/ledger-entry.entity';
import { AccountType } from '../../constants/account-types';
import {
  PaginationOptions,
  PaginatedResult,
} from './operation-repository.port';

// Re-export for convenience
export type {
  PaginationOptions,
  PaginatedResult,
} from './operation-repository.port';

export interface LedgerEntryFilters {
  memberId?: string;
  accountType?: AccountType;
  startDate?: Date;
  endDate?: Date;
}

export interface AccountsSummaryFilters {
  startDate?: Date;
  endDate?: Date;
  accountTypes?: AccountType[];
}

export interface AccountSummaryEntry {
  id: string;
  operationId: string;
  accountType: AccountType;
  amount: number;
  createdAt: Date;
  description: string | null;
  loanId: string | null;
  stockId: string | null;
  mandatoryContributionId: string | null;
  stockSubscriptionId: string | null;
  operationType?: string;
  operationDate?: Date;
}

export interface AccountSummaryData {
  accountType: AccountType;
  totalBalance: number;
  totalDebits: number;
  totalCredits: number;
  entriesCount: number;
  entries: AccountSummaryEntry[];
}

export interface LedgerEntryRepository {
  findById(id: string): Promise<LedgerEntry | null>;
  findByOperation(operationId: string): Promise<LedgerEntry[]>;
  findByOperations(operationIds: string[]): Promise<LedgerEntry[]>;
  findByMeeting(meetingId: string): Promise<LedgerEntry[]>;
  findByAccountType(accountType: string): Promise<LedgerEntry[]>;
  findWithPagination(
    filters: LedgerEntryFilters,
    pagination: PaginationOptions,
    orderBy: 'ASC' | 'DESC',
  ): Promise<PaginatedResult<LedgerEntry>>;
  save(entry: LedgerEntry): Promise<LedgerEntry>;
  saveMany(entries: LedgerEntry[]): Promise<LedgerEntry[]>;
  sumByAccountType(accountType: string): Promise<number>;
  getAccountsSummary(
    filters: AccountsSummaryFilters,
    entriesLimit: number,
  ): Promise<AccountSummaryData[]>;
}
