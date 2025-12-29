import { Loan } from '../entities/loan.entity';

/**
 * Amortization Schedule Item
 * Represents a single payment in an amortization schedule
 */
export interface AmortizationSchedule {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

/**
 * Payment Simulation Result
 * Result of simulating a payment scenario
 */
export interface PaymentSimulation {
  totalInterest: number;
  totalPayments: number;
  monthsSaved: number;
  schedule: AmortizationSchedule[];
}

/**
 * Domain Service for calculating amortization schedules
 * Contains only domain logic, no infrastructure dependencies
 */
export class AmortizationCalculatorService {
  /**
   * Calculates French amortization schedule (constant payment)
   * Formula: PMT = PV * (r * (1 + r)^n) / ((1 + r)^n - 1)
   * Where:
   * - PMT = constant payment
   * - PV = present value (principal)
   * - r = interest rate per period
   * - n = number of periods
   *
   * @param principal - Initial loan amount
   * @param rate - Monthly interest rate (as decimal, e.g., 0.01 for 1%)
   * @param term - Number of months
   * @returns Array of amortization schedule items
   */
  calculateFrenchAmortization(
    principal: number,
    rate: number,
    term: number,
  ): AmortizationSchedule[] {
    this.validateInputs(principal, rate, term);

    const schedule: AmortizationSchedule[] = [];
    let balance = principal;

    // Calculate constant payment using PMT formula
    const monthlyPayment =
      rate === 0
        ? principal / term
        : (principal * rate * Math.pow(1 + rate, term)) /
          (Math.pow(1 + rate, term) - 1);

    for (let month = 1; month <= term; month++) {
      const interest = balance * rate;
      const principalPayment = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: monthlyPayment,
        interest,
        principal: principalPayment,
        balance,
      });

      // Stop if balance reaches zero (due to rounding)
      if (balance <= 0.01) {
        break;
      }
    }

    return schedule;
  }

  /**
   * Calculates German amortization schedule (constant principal)
   * Principal payment is constant, interest decreases over time
   *
   * @param principal - Initial loan amount
   * @param rate - Monthly interest rate (as decimal, e.g., 0.01 for 1%)
   * @param term - Number of months
   * @returns Array of amortization schedule items
   */
  calculateGermanAmortization(
    principal: number,
    rate: number,
    term: number,
  ): AmortizationSchedule[] {
    this.validateInputs(principal, rate, term);

    const schedule: AmortizationSchedule[] = [];
    let balance = principal;
    const constantPrincipal = principal / term;

    for (let month = 1; month <= term; month++) {
      const interest = balance * rate;
      const principalPayment = Math.min(constantPrincipal, balance);
      const totalPayment = interest + principalPayment;
      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: totalPayment,
        interest,
        principal: principalPayment,
        balance,
      });

      // Stop if balance reaches zero
      if (balance <= 0.01) {
        break;
      }
    }

    return schedule;
  }

  /**
   * Simulates a payment scenario with extra payments
   *
   * @param loan - The loan entity
   * @param extraPayment - Extra payment amount per month (optional)
   * @param startMonth - Month to start extra payments (1-based, default: 1)
   * @param amortizationType - Type of amortization ('french' | 'german', default: 'french')
   * @returns Payment simulation result
   */
  simulatePaymentScenario(
    loan: Loan,
    extraPayment: number = 0,
    startMonth: number = 1,
    amortizationType: 'french' | 'german' = 'french',
  ): PaymentSimulation {
    if (extraPayment < 0) {
      throw new Error('Extra payment cannot be negative');
    }
    if (startMonth < 1) {
      throw new Error('Start month must be >= 1');
    }

    const principal = loan.outstandingBalance;
    const rate = loan.interestRate;
    const term = loan.term;

    // Get base schedule
    const baseSchedule =
      amortizationType === 'french'
        ? this.calculateFrenchAmortization(principal, rate, term)
        : this.calculateGermanAmortization(principal, rate, term);

    // Apply extra payments
    const schedule: AmortizationSchedule[] = [];
    let balance = principal;
    let monthsSaved = 0;

    for (let i = 0; i < baseSchedule.length; i++) {
      const baseItem = baseSchedule[i];
      const month = i + 1;

      // Calculate interest on current balance
      const interest = balance * rate;

      // Base principal payment
      let principalPayment = baseItem.principal;

      // Add extra payment if applicable
      if (month >= startMonth && extraPayment > 0) {
        principalPayment += extraPayment;
      }

      // Ensure we don't pay more than the balance
      principalPayment = Math.min(principalPayment, balance);

      const totalPayment = interest + principalPayment;
      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: totalPayment,
        interest,
        principal: principalPayment,
        balance,
      });

      // If balance is paid off early, calculate months saved
      if (balance <= 0.01 && month < baseSchedule.length) {
        monthsSaved = baseSchedule.length - month;
        break;
      }
    }

    // Calculate totals
    const totalInterest = schedule.reduce(
      (sum, item) => sum + item.interest,
      0,
    );
    const totalPayments = schedule.reduce((sum, item) => sum + item.payment, 0);

    return {
      totalInterest,
      totalPayments,
      monthsSaved,
      schedule,
    };
  }

  /**
   * Validates input parameters
   *
   * @param principal - Loan principal
   * @param rate - Interest rate
   * @param term - Loan term
   */
  private validateInputs(principal: number, rate: number, term: number): void {
    if (principal <= 0) {
      throw new Error('Principal must be > 0');
    }
    if (rate < 0 || rate > 1) {
      throw new Error('Interest rate must be between 0 and 1');
    }
    if (term < 1) {
      throw new Error('Term must be >= 1');
    }
  }
}
