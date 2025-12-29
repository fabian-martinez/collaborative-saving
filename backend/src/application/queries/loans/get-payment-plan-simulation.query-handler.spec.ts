import { GetPaymentPlanSimulationQueryHandler } from './get-payment-plan-simulation.query-handler';
import { AmortizationCalculatorService } from '@domain/services/amortization-calculator.service';
import { PaymentPlanRequestDto } from '@application/dto/loans/payment-plan-request.dto';
import { PaymentPlanResponseDto } from '@application/dto/loans/payment-plan-response.dto';

describe('GetPaymentPlanSimulationQueryHandler', () => {
  let queryHandler: GetPaymentPlanSimulationQueryHandler;
  let amortizationCalculatorService: jest.Mocked<AmortizationCalculatorService>;

  beforeEach(() => {
    amortizationCalculatorService = {
      calculateFrenchAmortization: jest.fn(),
      calculateGermanAmortization: jest.fn(),
      simulatePaymentScenario: jest.fn(),
    } as unknown as jest.Mocked<AmortizationCalculatorService>;

    queryHandler = new GetPaymentPlanSimulationQueryHandler(
      amortizationCalculatorService,
    );
  });

  describe('execute', () => {
    it('should calculate French amortization schedule', () => {
      // ARRANGE
      const request: PaymentPlanRequestDto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortizationType: 'french',
      };

      const mockSchedule = [
        {
          month: 1,
          payment: 88848.78,
          interest: 10000,
          principal: 78848.78,
          balance: 921151.22,
        },
        {
          month: 2,
          payment: 88848.78,
          interest: 9211.51,
          principal: 79637.27,
          balance: 841513.95,
        },
      ];

      amortizationCalculatorService.calculateFrenchAmortization.mockReturnValue(
        mockSchedule,
      );

      // ACT
      const result: PaymentPlanResponseDto = queryHandler.execute(request);

      // ASSERT
      expect(result.principal).toBe(1000000);
      expect(result.rate).toBe(0.01);
      expect(result.term).toBe(12);
      expect(result.amortizationType).toBe('french');
      expect(result.schedule).toHaveLength(2);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalPayments).toBeGreaterThan(0);
      expect(
        amortizationCalculatorService.calculateFrenchAmortization.mock.calls,
      ).toHaveLength(1);
      expect(
        amortizationCalculatorService.calculateFrenchAmortization.mock.calls[0],
      ).toEqual([1000000, 0.01, 12]);
    });

    it('should calculate German amortization schedule', () => {
      // ARRANGE
      const request: PaymentPlanRequestDto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortizationType: 'german',
      };

      const mockSchedule = [
        {
          month: 1,
          payment: 93333.33,
          interest: 10000,
          principal: 83333.33,
          balance: 916666.67,
        },
        {
          month: 2,
          payment: 92500,
          interest: 9166.67,
          principal: 83333.33,
          balance: 833333.34,
        },
      ];

      amortizationCalculatorService.calculateGermanAmortization.mockReturnValue(
        mockSchedule,
      );

      // ACT
      const result: PaymentPlanResponseDto = queryHandler.execute(request);

      // ASSERT
      expect(result.amortizationType).toBe('german');
      expect(
        amortizationCalculatorService.calculateGermanAmortization.mock.calls,
      ).toHaveLength(1);
      expect(
        amortizationCalculatorService.calculateGermanAmortization.mock.calls[0],
      ).toEqual([1000000, 0.01, 12]);
    });

    it('should throw error for invalid principal', () => {
      // ARRANGE
      const request: PaymentPlanRequestDto = {
        principal: -1000,
        rate: 0.01,
        term: 12,
        amortizationType: 'french',
      };

      // ACT & ASSERT
      expect(() => queryHandler.execute(request)).toThrow(
        'Principal must be > 0',
      );
    });

    it('should throw error for invalid rate', () => {
      // ARRANGE
      const request: PaymentPlanRequestDto = {
        principal: 1000000,
        rate: 1.5,
        term: 12,
        amortizationType: 'french',
      };

      // ACT & ASSERT
      expect(() => queryHandler.execute(request)).toThrow(
        'Interest rate must be between 0 and 1',
      );
    });

    it('should throw error for invalid term', () => {
      // ARRANGE
      const request: PaymentPlanRequestDto = {
        principal: 1000000,
        rate: 0.01,
        term: 0,
        amortizationType: 'french',
      };

      // ACT & ASSERT
      expect(() => queryHandler.execute(request)).toThrow('Term must be >= 1');
    });

    it('should calculate total interest and payments correctly', () => {
      // ARRANGE
      const request: PaymentPlanRequestDto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortizationType: 'french',
      };

      const mockSchedule = [
        {
          month: 1,
          payment: 100000,
          interest: 10000,
          principal: 90000,
          balance: 910000,
        },
        {
          month: 2,
          payment: 100000,
          interest: 9100,
          principal: 90900,
          balance: 819100,
        },
      ];

      amortizationCalculatorService.calculateFrenchAmortization.mockReturnValue(
        mockSchedule,
      );

      // ACT
      const result: PaymentPlanResponseDto = queryHandler.execute(request);

      // ASSERT
      expect(result.totalInterest).toBe(19100);
      expect(result.totalPayments).toBe(200000);
    });
  });
});
