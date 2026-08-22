/**
 * DTO for updating a loan's approved amount
 */
export interface UpdateLoanApprovedAmountDto {
  loanId: string;
  newApprovedAmount: number;
  changedBy?: string;
}
