import { AccountSummaryDto } from './account-summary.dto';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AccountsSummaryMetadata {
  queryDate: Date;
  dateRange?: DateRange;
  entriesLimit: number;
}

export interface AccountsSummarySummary {
  totalAccounts: number;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
}

export class GetAccountsSummaryResponseDto {
  accounts: AccountSummaryDto[];
  summary: AccountsSummarySummary;
  metadata: AccountsSummaryMetadata;
}

