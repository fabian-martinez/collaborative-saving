/**
 * Payment Item DTO
 *
 * DTO for a single payment item in a monthly payment request.
 */
export enum PaymentType {
  MANDATORY_CONTRIBUTION = 'mandatory_contribution',
  STOCK_FEE = 'stock_fee',
  LOAN_PAYMENT = 'loan_payment',
  FEE = 'fee',
  INSURANCE = 'insurance',
  NOVELTY = 'novelty',
}

export interface PaymentItemDto {
  type: PaymentType;
  amount: number;
  description?: string;
  referenceId?: string;
  noveltyComment?: string;
  affectedPaymentType?: PaymentType;
  isFullPayoff?: boolean;
}
