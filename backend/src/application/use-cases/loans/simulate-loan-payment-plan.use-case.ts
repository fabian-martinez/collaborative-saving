import { Injectable } from '@nestjs/common';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { AmortizationCalculatorService } from '@domain/services/amortization-calculator.service';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { SimulateLoanScenariosRequestDto } from '@application/dto/loans/simulate-loan-scenarios-request.dto';
import { SimulateLoanScenariosResponseDto } from '@application/dto/loans/simulate-loan-scenarios-response.dto';
import { PaymentSimulationDto } from '@application/dto/loans/payment-simulation.dto';
import { AmortizationScheduleDto } from '@application/dto/loans/amortization-schedule.dto';

/**
 * Simulate Loan Payment Plan Use Case
 *
 * Compares different payment scenarios for an existing loan
 */
@Injectable()
export class SimulateLoanPaymentPlanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly amortizationCalculatorService: AmortizationCalculatorService,
  ) {}

  async execute(
    loanId: string,
    request: SimulateLoanScenariosRequestDto,
  ): Promise<SimulateLoanScenariosResponseDto> {
    // 1. Get loan
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new LoanNotFoundException(loanId);
    }

    // 2. Calculate base scenario (no extra payments)
    const baseSimulation =
      this.amortizationCalculatorService.simulatePaymentScenario(
        loan,
        0,
        1,
        'french',
      );

    const baseScenarioDto: PaymentSimulationDto = {
      totalInterest: baseSimulation.totalInterest,
      totalPayments: baseSimulation.totalPayments,
      monthsSaved: baseSimulation.monthsSaved,
      schedule: baseSimulation.schedule.map(
        (item): AmortizationScheduleDto => ({
          month: item.month,
          payment: item.payment,
          interest: item.interest,
          principal: item.principal,
          balance: item.balance,
        }),
      ),
    };

    // 3. Calculate scenarios
    const scenarios = request.scenarios.map((scenario) => {
      const simulation =
        this.amortizationCalculatorService.simulatePaymentScenario(
          loan,
          scenario.extraPayment || 0,
          scenario.startMonth || 1,
          scenario.amortizationType || 'french',
        );

      const simulationDto: PaymentSimulationDto = {
        totalInterest: simulation.totalInterest,
        totalPayments: simulation.totalPayments,
        monthsSaved: simulation.monthsSaved,
        schedule: simulation.schedule.map(
          (item): AmortizationScheduleDto => ({
            month: item.month,
            payment: item.payment,
            interest: item.interest,
            principal: item.principal,
            balance: item.balance,
          }),
        ),
      };

      // Calculate savings compared to base scenario
      const interestSaved =
        baseSimulation.totalInterest - simulation.totalInterest;
      const monthsSaved = simulation.monthsSaved;
      const totalSavings = interestSaved;

      return {
        name: scenario.name,
        simulation: simulationDto,
        savings: {
          interestSaved,
          monthsSaved,
          totalSavings,
        },
      };
    });

    // 4. Generate recommendations
    const recommendations = this.generateRecommendations(
      baseScenarioDto,
      scenarios,
    );

    return {
      loanId: loan.id,
      baseScenario: baseScenarioDto,
      scenarios,
      recommendations,
    };
  }

  /**
   * Generates recommendations based on scenarios
   */
  private generateRecommendations(
    baseScenario: PaymentSimulationDto,
    scenarios: Array<{
      name: string;
      simulation: PaymentSimulationDto;
      savings: {
        interestSaved: number;
        monthsSaved: number;
        totalSavings: number;
      };
    }>,
  ): string[] {
    const recommendations: string[] = [];

    if (scenarios.length === 0) {
      return recommendations;
    }

    // Find best scenario for interest savings
    const bestInterestSavings = scenarios.reduce((best, current) => {
      return current.savings.interestSaved > best.savings.interestSaved
        ? current
        : best;
    }, scenarios[0]);

    if (bestInterestSavings.savings.interestSaved > 0) {
      recommendations.push(
        `El escenario "${bestInterestSavings.name}" ahorra ${bestInterestSavings.savings.interestSaved.toFixed(2)} en intereses comparado con el plan base.`,
      );
    }

    // Find best scenario for time savings
    const bestTimeSavings = scenarios.reduce((best, current) => {
      return current.savings.monthsSaved > best.savings.monthsSaved
        ? current
        : best;
    }, scenarios[0]);

    if (bestTimeSavings.savings.monthsSaved > 0) {
      recommendations.push(
        `El escenario "${bestTimeSavings.name}" reduce el plazo en ${bestTimeSavings.savings.monthsSaved} meses.`,
      );
    }

    // General recommendation
    if (
      bestInterestSavings.savings.totalSavings >
      baseScenario.totalInterest * 0.1
    ) {
      recommendations.push(
        'Considera realizar pagos adicionales para reducir significativamente el costo total del préstamo.',
      );
    }

    return recommendations;
  }
}
