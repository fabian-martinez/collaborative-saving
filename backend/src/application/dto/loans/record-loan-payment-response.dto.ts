/**
 * Record Loan Payment Response DTO
 *
 * Output DTO returned after successfully recording a loan payment.
 * Contains details about the payment distribution and resulting loan state.
 */
export interface RecordLoanPaymentResponseDto {
  /** The ID of the loan that received the payment */
  loanId: string;

  /** The ID of the operation created for this payment */
  operationId: string;

  /** Amount applied to interest */
  interestPaid: number;

  /** Amount applied to principal */
  principalPaid: number;

  /** The new outstanding balance after the payment */
  newOutstandingBalance: number;

  /** The current status of the loan after the payment */
  loanStatus: string;

  /** IDs of the LoanTransactionDetails created for this payment */
  transactionDetailIds: string[];
}
