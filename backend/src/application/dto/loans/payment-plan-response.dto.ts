import { AmortizationScheduleDto } from './amortization-schedule.dto';

/**
 * Payment Plan Response DTO
 * For generic payment plan simulation
 */
export class PaymentPlanResponseDto {
  principal: number;
  rate: number;
  term: number;
  amortizationType: 'french' | 'german';
  schedule: AmortizationScheduleDto[];
  totalInterest: number;
  totalPayments: number;
}
