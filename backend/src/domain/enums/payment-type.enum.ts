/**
 * Payment Type Enum
 *
 * Types of payments that can be made by members.
 * This enum represents the different payment categories in the domain.
 */
export enum PaymentType {
  MANDATORY_CONTRIBUTION = 'mandatory_contribution',
  STOCK_FEE = 'stock_fee',
  LOAN_PAYMENT = 'loan_payment',
  FEE = 'fee',
  INSURANCE = 'insurance',
  NOVELTY = 'novelty',
  STOCK_PURCHASE = 'stock_purchase',
  STOCK_MODIFICATION = 'stock_modification',
}
