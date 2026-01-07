import { AccountType } from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

export class AccountLedgerEntryDto {
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
  operationType?: OperationType;
  operationDate?: Date;
}
