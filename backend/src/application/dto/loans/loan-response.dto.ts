/**
 * Loan Response DTO
 *
 * Output DTO for loan queries.
 * Contains all loan information for display purposes.
 */
export class LoanResponseDto {
  id: string;
  memberId: string;
  loanType: string;
  approvedAmount: number;
  disbursedAmount: number;
  outstandingBalance: number;
  monthlyPaymentAmount: number;
  interestRate: number;
  term: number;
  status: string;
  creationDate: Date;
  guaranteedStockId: string | null | undefined;
}

