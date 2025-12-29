/**
 * Simulate Loan Scenarios Request DTO
 * For comparing payment scenarios for an existing loan
 */
export class SimulateLoanScenariosRequestDto {
  scenarios: Array<{
    name: string;
    extraPayment?: number; // Extra payment per month
    startMonth?: number; // Month to start extra payments (1-based)
    amortizationType?: 'french' | 'german'; // Default: 'french'
  }>;
}
