import { Injectable } from '@nestjs/common';
import { AmortizationCalculatorService } from '@domain/services/amortization-calculator.service';
import { PaymentPlanRequestDto } from '@application/dto/loans/payment-plan-request.dto';
import { PaymentPlanResponseDto } from '@application/dto/loans/payment-plan-response.dto';
import { AmortizationScheduleDto } from '@application/dto/loans/amortization-schedule.dto';

/**
 * Get Payment Plan Simulation Query Handler
 *
 * Calculates amortization schedule for generic loan parameters
 */
@Injectable()
export class GetPaymentPlanSimulationQueryHandler {
  constructor(
    private readonly amortizationCalculatorService: AmortizationCalculatorService,
  ) {}

  execute(request: PaymentPlanRequestDto): PaymentPlanResponseDto {
    // Validate inputs
    if (request.principal <= 0) {
      throw new Error('Principal must be > 0');
    }
    if (request.rate < 0 || request.rate > 1) {
      throw new Error('Interest rate must be between 0 and 1');
    }
    if (request.term < 1) {
      throw new Error('Term must be >= 1');
    }

    // Calculate amortization schedule
    const schedule =
      request.amortizationType === 'french'
        ? this.amortizationCalculatorService.calculateFrenchAmortization(
            request.principal,
            request.rate,
            request.term,
          )
        : this.amortizationCalculatorService.calculateGermanAmortization(
            request.principal,
            request.rate,
            request.term,
          );

    // Calculate totals
    const totalInterest = schedule.reduce(
      (sum, item) => sum + item.interest,
      0,
    );
    const totalPayments = schedule.reduce((sum, item) => sum + item.payment, 0);

    // Map to DTOs
    const scheduleDto: AmortizationScheduleDto[] = schedule.map((item) => ({
      month: item.month,
      payment: item.payment,
      interest: item.interest,
      principal: item.principal,
      balance: item.balance,
    }));

    return {
      principal: request.principal,
      rate: request.rate,
      term: request.term,
      amortizationType: request.amortizationType,
      schedule: scheduleDto,
      totalInterest,
      totalPayments,
    };
  }
}
