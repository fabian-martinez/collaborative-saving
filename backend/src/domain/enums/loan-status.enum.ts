/**
 * Loan Status Enum
 *
 * Status of a loan in its lifecycle.
 * This enum represents the different states a loan can have in the domain.
 */
export enum LoanStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAID = 'paid',
  DEFAULTED = 'defaulted',
  CLOSED = 'closed',
}
