/**
 * Create Loan DTO
 *
 * Input DTO for creating a new loan.
 * Contains all necessary information to create a loan.
 */
export interface CreateLoanDto {
  memberId: string;
  meetingId: string;
  loanType: 'corriente' | 'agil' | 'accion';
  approvedAmount: number;
  monthlyPaymentAmount: number;
  interestRate: number;
  term: number;
  guaranteedStockId?: string | null;
  disbursedAmount?: number;
  outstandingBalance?: number;
}
