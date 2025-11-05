/**
 * Member Payment Entry DTO
 *
 * DTO for a single ledger entry within a payment.
 */
export class MemberPaymentEntryDto {
  id: string;
  accountType: string;
  amount: number;
  description?: string;
  loanId?: string;
  stockId?: string;
  mandatoryContributionId?: string;
  stockSubscriptionId?: string;
}
