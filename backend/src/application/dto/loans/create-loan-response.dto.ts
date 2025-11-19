/**
 * Create Loan Response DTO
 *
 * Output DTO returned after successfully creating a loan.
 * Contains loan ID, operation ID, and status.
 */
export interface CreateLoanResponseDto {
  loanId: string;
  operationId: string;
  status: string;
}
