/**
 * Payment Type Enum
 *
 * Defines the types of payments that can be recorded for a member.
 */
export enum PaymentType {
  MANDATORY_CONTRIBUTION = 'mandatory_contribution',
  STOCK_FEE = 'stock_fee',
  LOAN_PAYMENT = 'loan_payment',
  FEE = 'fee',
  INSURANCE = 'insurance',
  NOVELTY = 'novelty',
}

/**
 * Payment Item DTO
 *
 * Represents a single payment item in a monthly payment request.
 * Each payment item corresponds to a specific payment type (e.g., loan payment, stock fee).
 */
export interface PaymentItemDto {
  type: PaymentType;
  amount: number;
  description?: string;
  referenceId?: string;
}
