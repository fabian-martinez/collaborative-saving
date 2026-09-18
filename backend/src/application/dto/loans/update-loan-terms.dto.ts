/**
 * Update Loan Terms DTO
 *
 * Input DTO for updating loan terms (interest rate, monthly payment, term).
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateLoanTermsDto {
  loanId: string;
  interestRate?: number;
  monthlyPaymentAmount?: number;
  term?: number;
  loanType?: string;
  changedBy?: string; // User ID who made the change (for auditing)
}
