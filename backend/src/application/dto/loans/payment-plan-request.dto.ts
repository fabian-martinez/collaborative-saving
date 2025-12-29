/**
 * Payment Plan Request DTO
 * For generic payment plan simulation
 */
export class PaymentPlanRequestDto {
  principal: number;
  rate: number; // Monthly interest rate as decimal (e.g., 0.01 for 1%)
  term: number; // Number of months
  amortizationType: 'french' | 'german';
}
