import { Loan } from '../entities/loan.entity';
import { LoanTransactionDetail } from '../entities/loan-transaction-detail.entity';

/**
 * Payment Projection
 * Represents a projected future payment for a loan
 */
export interface PaymentProjection {
  loanId: string;
  loanType: string;
  date: Date;
  totalAmount: number;
  interestAmount: number;
  principalAmount: number;
  remainingBalance: number;
  paymentNumber: number;
}

/**
 * Domain Service for calculating payment projections
 * Contains only domain logic, no infrastructure dependencies
 */
export class PaymentProjectionService {
  /**
   * Projects future payments for active loans
   *
   * @param loans - Array of active loans
   * @param transactions - Historical transactions for these loans
   * @param startDate - Start date for projections
   * @param months - Number of months to project forward
   * @returns Array of payment projections
   */
  projectFuturePayments(
    loans: Loan[],
    transactions: LoanTransactionDetail[],
    startDate: Date,
    months: number,
  ): PaymentProjection[] {
    const projections: PaymentProjection[] = [];
    const activeLoans = loans.filter((loan) => loan.isActive());

    for (const loan of activeLoans) {
      const loanTransactions = transactions.filter((t) => t.loanId === loan.id);

      // Calculate how many payments have been made
      const paymentsMade = this.countPaymentsMade(loanTransactions);

      // Calculate next payment date
      const nextPaymentDate = this.calculateNextPaymentDate(
        loan,
        loanTransactions,
        startDate,
      );

      // Project payments for the specified number of months
      let currentDate = new Date(nextPaymentDate);
      let currentBalance = loan.outstandingBalance;
      const paymentNumber = paymentsMade + 1;

      for (let month = 0; month < months; month++) {
        // Check if loan would be paid off
        if (currentBalance <= 0) {
          break;
        }

        // Calculate interest for this period
        const interestAmount = currentBalance * loan.interestRate;

        // Calculate principal payment
        // If monthly payment amount covers interest + some principal
        let principalAmount = loan.monthlyPaymentAmount - interestAmount;

        // If monthly payment doesn't cover interest, only pay interest
        if (principalAmount < 0) {
          principalAmount = 0;
        }

        // If remaining balance is less than principal, adjust
        if (principalAmount > currentBalance) {
          principalAmount = currentBalance;
        }

        const totalAmount = interestAmount + principalAmount;
        currentBalance -= principalAmount;

        projections.push({
          loanId: loan.id,
          loanType: loan.loanType,
          date: new Date(currentDate),
          totalAmount,
          interestAmount,
          principalAmount,
          remainingBalance: currentBalance,
          paymentNumber: paymentNumber + month,
        });

        // Move to next month
        currentDate = this.addMonths(currentDate, 1);

        // If balance is zero, stop projecting
        if (currentBalance <= 0) {
          break;
        }
      }
    }

    // Sort by date
    projections.sort((a, b) => a.date.getTime() - b.date.getTime());

    return projections;
  }

  /**
   * Calculates the next payment date for a loan
   *
   * @param loan - The loan
   * @param transactions - Historical transactions
   * @param referenceDate - Reference date (usually today or start of projection)
   * @returns Next payment date
   */
  calculateNextPaymentDate(
    loan: Loan,
    transactions: LoanTransactionDetail[],
    referenceDate: Date,
  ): Date {
    // If no payments have been made, start from creation date + 1 month
    const paymentTransactions = transactions.filter(
      (t) =>
        t.transactionType === 'principal_payment' ||
        t.transactionType === 'interest_payment',
    );

    if (paymentTransactions.length === 0) {
      return this.addMonths(loan.creationDate, 1);
    }

    // Find the most recent payment date
    const lastPaymentDate = paymentTransactions.reduce(
      (latest, transaction) => {
        const transactionDate = new Date(transaction.transactionDate);
        return transactionDate > latest ? transactionDate : latest;
      },
      new Date(0),
    );

    // Next payment is one month after last payment
    const nextPayment = this.addMonths(lastPaymentDate, 1);

    // If next payment is in the past, use reference date
    if (nextPayment < referenceDate) {
      return referenceDate;
    }

    return nextPayment;
  }

  /**
   * Counts how many payment transactions have been made
   *
   * @param transactions - Loan transactions
   * @returns Number of payment periods (grouped by operation)
   */
  private countPaymentsMade(transactions: LoanTransactionDetail[]): number {
    const paymentTransactions = transactions.filter(
      (t) =>
        t.transactionType === 'principal_payment' ||
        t.transactionType === 'interest_payment',
    );

    // Group by operation ID to count payment periods
    const operationIds = new Set(
      paymentTransactions
        .map((t) => t.operationId)
        .filter((id): id is string => id !== null && id !== undefined),
    );

    return operationIds.size;
  }

  /**
   * Adds months to a date
   *
   * @param date - Base date
   * @param months - Number of months to add
   * @returns New date
   */
  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
}
