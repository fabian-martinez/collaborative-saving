import { AccountType } from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

export type LoanPaymentMethod = 'cash' | 'stock' | 'equity';

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

  /**
   * Optional: Date of the payment operation.
   * If not provided, defaults to current date.
   * Useful to align the operation date with the meeting date.
   */
  date?: Date;

  /**
   * Optional: Payment method used for the loan payment.
   * 'cash' (default): debits CASH_ACCOUNT
   * 'stock': debits STOCK_CAPITAL_ACCOUNT and sets operation type to STOCK_LOAN_PAYMENT
   * 'equity': debits MEMBER_EQUITY_ACCOUNT
   */
  paymentMethod?: LoanPaymentMethod;

  /**
   * Optional: Explicit account type to debit for funding the payment.
   * If provided, overrides the default account determined by paymentMethod.
   */
  sourceAccount?: AccountType;

  /**
   * Optional: ID of the stock when payment is made using stocks.
   * Added to the debit ledger entry.
   */
  stockId?: string;

  /**
   * Optional: ID of the stock subscription when payment is made using stocks.
   * Added to the debit ledger entry.
   */
  stockSubscriptionId?: string;

  /**
   * Optional: Override the operation type.
   * If not provided, defaults to STOCK_LOAN_PAYMENT when paymentMethod is 'stock'
   * or sourceAccount is STOCK_CAPITAL_ACCOUNT, and LOAN_PAYMENT otherwise.
   */
  operationType?: OperationType;
}
