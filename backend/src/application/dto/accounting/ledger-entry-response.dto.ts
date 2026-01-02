import { AccountType } from '@domain/constants/account-types';

export class LedgerEntryResponseDto {
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
}

