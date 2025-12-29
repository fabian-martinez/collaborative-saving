import { AmortizationCalculatorService } from './amortization-calculator.service';
import { Loan, LoanStatus } from '../entities/loan.entity';

describe('AmortizationCalculatorService', () => {
  let service: AmortizationCalculatorService;

  beforeEach(() => {
    service = new AmortizationCalculatorService();
  });

  describe('calculateFrenchAmortization', () => {
    it('should calculate correct French amortization schedule', () => {
      const principal = 1000000;
      const rate = 0.01; // 1% monthly
      const term = 12;

      const schedule = service.calculateFrenchAmortization(
        principal,
        rate,
        term,
      );

      expect(schedule).toHaveLength(12);
      expect(schedule[0].month).toBe(1);
      // Balance after first payment should be less than principal
      // Initial balance = balance + principalPayment
      const initialBalance = schedule[0].balance + schedule[0].principal;
      expect(initialBalance).toBeCloseTo(principal, 0);

      // Payment should be constant
      const firstPayment = schedule[0].payment;
      schedule.forEach((item) => {
        expect(item.payment).toBeCloseTo(firstPayment, 2);
      });

      // Balance should decrease
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].balance).toBeLessThan(schedule[i - 1].balance);
      }

      // Last balance should be close to zero
      expect(schedule[schedule.length - 1].balance).toBeLessThan(1);
    });

    it('should handle zero interest rate', () => {
      const principal = 1000000;
      const rate = 0;
      const term = 12;

      const schedule = service.calculateFrenchAmortization(
        principal,
        rate,
        term,
      );

      expect(schedule).toHaveLength(12);
      schedule.forEach((item) => {
        expect(item.interest).toBe(0);
        expect(item.payment).toBeCloseTo(principal / term, 2);
        expect(item.principal).toBeCloseTo(principal / term, 2);
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() =>
        service.calculateFrenchAmortization(-1000, 0.01, 12),
      ).toThrow('Principal must be > 0');

      expect(() =>
        service.calculateFrenchAmortization(1000, -0.01, 12),
      ).toThrow('Interest rate must be between 0 and 1');

      expect(() => service.calculateFrenchAmortization(1000, 1.5, 12)).toThrow(
        'Interest rate must be between 0 and 1',
      );

      expect(() => service.calculateFrenchAmortization(1000, 0.01, 0)).toThrow(
        'Term must be >= 1',
      );
    });

    it('should have interest decreasing and principal increasing in French amortization', () => {
      const principal = 1000000;
      const rate = 0.01;
      const term = 12;

      const schedule = service.calculateFrenchAmortization(
        principal,
        rate,
        term,
      );

      // Interest should decrease over time
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].interest).toBeLessThan(schedule[i - 1].interest);
      }

      // Principal payment should increase over time
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].principal).toBeGreaterThan(
          schedule[i - 1].principal,
        );
      }
    });
  });

  describe('calculateGermanAmortization', () => {
    it('should calculate correct German amortization schedule', () => {
      const principal = 1000000;
      const rate = 0.01; // 1% monthly
      const term = 12;

      const schedule = service.calculateGermanAmortization(
        principal,
        rate,
        term,
      );

      expect(schedule).toHaveLength(12);
      expect(schedule[0].month).toBe(1);

      // Principal payment should be constant
      const constantPrincipal = principal / term;
      schedule.forEach((item) => {
        expect(item.principal).toBeCloseTo(constantPrincipal, 2);
      });

      // Interest should decrease over time
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].interest).toBeLessThan(schedule[i - 1].interest);
      }

      // Total payment should decrease over time
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].payment).toBeLessThan(schedule[i - 1].payment);
      }

      // Last balance should be close to zero
      expect(schedule[schedule.length - 1].balance).toBeLessThan(1);
    });

    it('should handle zero interest rate', () => {
      const principal = 1000000;
      const rate = 0;
      const term = 12;

      const schedule = service.calculateGermanAmortization(
        principal,
        rate,
        term,
      );

      expect(schedule).toHaveLength(12);
      schedule.forEach((item) => {
        expect(item.interest).toBe(0);
        expect(item.principal).toBeCloseTo(principal / term, 2);
        expect(item.payment).toBeCloseTo(principal / term, 2);
      });
    });

    it('should throw error for invalid inputs', () => {
      expect(() =>
        service.calculateGermanAmortization(-1000, 0.01, 12),
      ).toThrow('Principal must be > 0');

      expect(() =>
        service.calculateGermanAmortization(1000, -0.01, 12),
      ).toThrow('Interest rate must be between 0 and 1');

      expect(() => service.calculateGermanAmortization(1000, 0.01, 0)).toThrow(
        'Term must be >= 1',
      );
    });
  });

  describe('simulatePaymentScenario', () => {
    it('should simulate payment scenario without extra payments', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const simulation = service.simulatePaymentScenario(loan, 0, 1, 'french');

      expect(simulation.schedule.length).toBeGreaterThan(0);
      expect(simulation.totalInterest).toBeGreaterThan(0);
      expect(simulation.totalPayments).toBeGreaterThan(0);
      expect(simulation.monthsSaved).toBe(0);
    });

    it('should simulate payment scenario with extra payments', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const simulation = service.simulatePaymentScenario(
        loan,
        50000,
        1,
        'french',
      );

      expect(simulation.schedule.length).toBeLessThan(12);
      expect(simulation.monthsSaved).toBeGreaterThan(0);
      expect(simulation.totalInterest).toBeLessThan(
        service.simulatePaymentScenario(loan, 0, 1, 'french').totalInterest,
      );
    });

    it('should start extra payments from specified month', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const simulation = service.simulatePaymentScenario(
        loan,
        50000,
        3,
        'french',
      );

      // First two months should not have extra payment
      expect(simulation.schedule[0].principal).toBeLessThan(
        simulation.schedule[2].principal,
      );
    });

    it('should throw error for negative extra payment', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });

      expect(() =>
        service.simulatePaymentScenario(loan, -1000, 1, 'french'),
      ).toThrow('Extra payment cannot be negative');
    });

    it('should throw error for invalid start month', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });

      expect(() =>
        service.simulatePaymentScenario(loan, 1000, 0, 'french'),
      ).toThrow('Start month must be >= 1');
    });

    it('should work with German amortization', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const simulation = service.simulatePaymentScenario(loan, 0, 1, 'german');

      expect(simulation.schedule.length).toBeGreaterThan(0);
      // In German amortization, principal should be constant
      const firstPrincipal = simulation.schedule[0].principal;
      simulation.schedule.forEach((item) => {
        expect(item.principal).toBeCloseTo(firstPrincipal, 2);
      });
    });
  });
});
