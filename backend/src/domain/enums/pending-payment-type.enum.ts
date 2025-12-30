/**
 * Pending Payment Type Enum
 *
 * Types of pending payments that can be scheduled for disbursement.
 * This enum represents the different pending payment categories in the domain.
 */
export enum PendingPaymentType {
  DIVIDEND = 'dividend',
  STOCK_WITHDRAWAL = 'stock_withdrawal',
  LOAN = 'loan',
  OTHER = 'other',
}

