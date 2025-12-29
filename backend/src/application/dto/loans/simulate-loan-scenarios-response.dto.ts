import { PaymentSimulationDto } from './payment-simulation.dto';

/**
 * Simulate Loan Scenarios Response DTO
 */
export class SimulateLoanScenariosResponseDto {
  loanId: string;
  baseScenario: PaymentSimulationDto;
  scenarios: Array<{
    name: string;
    simulation: PaymentSimulationDto;
    savings: {
      interestSaved: number;
      monthsSaved: number;
      totalSavings: number;
    };
  }>;
  recommendations: string[];
}
