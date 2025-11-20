/**
 * New Loan Request DTO
 *
 * Request information for creating a new loan during disbursement
 */
export interface NewLoanRequestDto {
  memberId: string;
  amount: number;
  loanType: 'corriente' | 'agil' | 'accion' | 'prioritario';
  approvedAmount: number;
  monthlyPaymentAmount: number;
  interestRate: number;
  notes?: string;
}
