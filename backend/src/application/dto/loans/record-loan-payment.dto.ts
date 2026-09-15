/**
 * Record Loan Payment DTO
 *
 * Input DTO for recording a payment on an existing loan.
 * Encapsulates all information needed to process a loan payment.
 */
export interface RecordLoanPaymentDto {
  /** The ID of the loan to apply payment to */
  loanId: string;

  /** The ID of the meeting where the payment is being recorded */
  meetingId: string;

  /** The total payment amount to apply */
  totalPaymentAmount: number;

  /** Optional notes for the payment */
  notes?: string;

  /**
   * Optional: Force a specific interest amount instead of calculating.
   * When provided, this amount will be used for interest payment.
   * Useful for special cases like stock-based payments where interest is 0.
   */
  forcedInterestAmount?: number;

  /**
   * Optional: Force a specific principal amount instead of calculating.
   * When provided, this amount will be used for principal payment.
   */
  forcedPrincipalAmount?: number;

  /**
   * Optional: Flag indicating whether this payment is intended to fully liquidate the loan.
   * When true, principalPaid will cover the entire outstandingBalance.
   */
  isFullPayoff?: boolean;
}
