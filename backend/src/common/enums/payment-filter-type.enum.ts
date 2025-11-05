/**
 * Payment Filter Type Enum
 *
 * Types of payments that can be filtered when querying member payments.
 */
export enum PaymentFilterType {
  MONTHLY_PAYMENT = 'monthly_payment',
  STOCK_PURCHASE = 'stock_purchase',
  STOCK_MODIFICATION = 'stock_modification',
  LOAN_EXTRAORDINARY_PAYMENT = 'loan_extraordinary_payment',
}
