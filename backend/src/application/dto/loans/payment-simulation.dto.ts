import { AmortizationScheduleDto } from './amortization-schedule.dto';

/**
 * Payment Simulation DTO
 */
export class PaymentSimulationDto {
  totalInterest: number;
  totalPayments: number;
  monthsSaved: number;
  schedule: AmortizationScheduleDto[];
}
