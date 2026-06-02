import { SimulateLoanPaymentPlanUseCase } from './simulate-loan-payment-plan.use-case';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { AmortizationCalculatorService } from '@domain/services/amortization-calculator.service';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { SimulateLoanScenariosRequestDto } from '@application/dto/loans/simulate-loan-scenarios-request.dto';

describe('SimulateLoanPaymentPlanUseCase', () => {
  let useCase: SimulateLoanPaymentPlanUseCase;
  let loanRepository: jest.Mocked<LoanRepository>;
  let amortizationCalculatorService: jest.Mocked<AmortizationCalculatorService>;

  beforeEach(() => {
    loanRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    };

    amortizationCalculatorService = {
      calculateFrenchAmortization: jest.fn(),
      calculateGermanAmortization: jest.fn(),
      simulatePaymentScenario: jest.fn(),
    } as unknown as jest.Mocked<AmortizationCalculatorService>;

    useCase = new SimulateLoanPaymentPlanUseCase(
      loanRepository,
      amortizationCalculatorService,
    );
  });

  describe('execute', () => {
    const loanId = '550e8400-e29b-41d4-a716-446655440000';

    it('should throw error when loan not found', async () => {
      // ARRANGE
      loanRepository.findById.mockResolvedValue(null);

      const request: SimulateLoanScenariosRequestDto = {
        scenarios: [],
      };

      // ACT & ASSERT
      await expect(useCase.execute(loanId, request)).rejects.toThrow(
        LoanNotFoundException,
      );
    });

    it('should calculate base scenario and scenarios', async () => {
      // ARRANGE
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const baseSimulation = {
        totalInterest: 50000,
        totalPayments: 1050000,
        monthsSaved: 0,
        schedule: [
          {
            month: 1,
            payment: 100000,
            interest: 10000,
            principal: 90000,
            balance: 910000,
          },
        ],
      };

      const scenarioSimulation = {
        totalInterest: 30000,
        totalPayments: 1030000,
        monthsSaved: 2,
        schedule: [
          {
            month: 1,
            payment: 150000,
            interest: 10000,
            principal: 140000,
            balance: 860000,
          },
        ],
      };

      loanRepository.findById.mockResolvedValue(loan);
      amortizationCalculatorService.simulatePaymentScenario
        .mockReturnValueOnce(baseSimulation)
        .mockReturnValueOnce(scenarioSimulation);

      const request: SimulateLoanScenariosRequestDto = {
        scenarios: [
          {
            name: 'Extra $50,000/month',
            extraPayment: 50000,
            startMonth: 1,
            amortizationType: 'french',
          },
        ],
      };

      // ACT
      const result = await useCase.execute(loan.id, request);

      // ASSERT
      expect(result.loanId).toBe(loan.id);
      expect(result.baseScenario.totalInterest).toBe(50000);
      expect(result.scenarios).toHaveLength(1);
      expect(result.scenarios[0].name).toBe('Extra $50,000/month');
      expect(result.scenarios[0].savings.interestSaved).toBe(20000);
      expect(result.scenarios[0].savings.monthsSaved).toBe(2);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle multiple scenarios', async () => {
      // ARRANGE
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const baseSimulation = {
        totalInterest: 50000,
        totalPayments: 1050000,
        monthsSaved: 0,
        schedule: [],
      };

      const scenario1Simulation = {
        totalInterest: 30000,
        totalPayments: 1030000,
        monthsSaved: 2,
        schedule: [],
      };

      const scenario2Simulation = {
        totalInterest: 40000,
        totalPayments: 1040000,
        monthsSaved: 1,
        schedule: [],
      };

      loanRepository.findById.mockResolvedValue(loan);
      amortizationCalculatorService.simulatePaymentScenario
        .mockReturnValueOnce(baseSimulation)
        .mockReturnValueOnce(scenario1Simulation)
        .mockReturnValueOnce(scenario2Simulation);

      const request: SimulateLoanScenariosRequestDto = {
        scenarios: [
          {
            name: 'Scenario 1',
            extraPayment: 50000,
          },
          {
            name: 'Scenario 2',
            extraPayment: 25000,
          },
        ],
      };

      // ACT
      const result = await useCase.execute(loan.id, request);

      // ASSERT
      expect(result.scenarios).toHaveLength(2);
      expect(result.scenarios[0].savings.interestSaved).toBe(20000);
      expect(result.scenarios[1].savings.interestSaved).toBe(10000);
    });

    it('should generate recommendations', async () => {
      // ARRANGE
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const baseSimulation = {
        totalInterest: 100000,
        totalPayments: 1100000,
        monthsSaved: 0,
        schedule: [],
      };

      const scenarioSimulation = {
        totalInterest: 50000,
        totalPayments: 1050000,
        monthsSaved: 3,
        schedule: [],
      };

      loanRepository.findById.mockResolvedValue(loan);
      amortizationCalculatorService.simulatePaymentScenario
        .mockReturnValueOnce(baseSimulation)
        .mockReturnValueOnce(scenarioSimulation);

      const request: SimulateLoanScenariosRequestDto = {
        scenarios: [
          {
            name: 'Best Scenario',
            extraPayment: 50000,
          },
        ],
      };

      // ACT
      const result = await useCase.execute(loan.id, request);

      // ASSERT
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('ahorra'))).toBe(
        true,
      );
    });
  });
});
