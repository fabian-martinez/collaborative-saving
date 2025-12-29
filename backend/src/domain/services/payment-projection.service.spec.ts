import { PaymentProjectionService } from './payment-projection.service';
import { Loan, LoanStatus } from '../entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '../entities/loan-transaction-detail.entity';

describe('PaymentProjectionService', () => {
  let service: PaymentProjectionService;

  beforeEach(() => {
    service = new PaymentProjectionService();
  });

  describe('projectFuturePayments', () => {
    it('should project payments for active loan', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01, // 1% monthly
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const transactions: LoanTransactionDetail[] = [];
      const startDate = new Date('2024-01-01');
      const projections = service.projectFuturePayments(
        [loan],
        transactions,
        startDate,
        3,
      );

      expect(projections).toHaveLength(3);
      expect(projections[0].loanId).toBe(loan.id);
      expect(projections[0].totalAmount).toBeGreaterThan(0);
      expect(projections[0].interestAmount).toBeGreaterThan(0);
      expect(projections[0].principalAmount).toBeGreaterThan(0);
    });

    it('should exclude inactive loans', () => {
      const activeLoan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      activeLoan.update({ status: LoanStatus.ACTIVE });

      const paidLoan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 500000,
        monthlyPaymentAmount: 50000,
        interestRate: 0.01,
        term: 12,
      });
      paidLoan.update({ status: LoanStatus.PAID });

      const projections = service.projectFuturePayments(
        [activeLoan, paidLoan],
        [],
        new Date('2024-01-01'),
        3,
      );

      expect(projections.every((p) => p.loanId === activeLoan.id)).toBe(true);
    });

    it('should adjust projections based on historical payments', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE, outstandingBalance: 800000 });

      const transactions: LoanTransactionDetail[] = [
        LoanTransactionDetail.create({
          loanId: loan.id,
          transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
          amount: 100000,
          transactionDate: new Date('2024-01-15'),
          operationId: 'op-1',
        }),
        LoanTransactionDetail.create({
          loanId: loan.id,
          transactionType: LoanTransactionType.INTEREST_PAYMENT,
          amount: 10000,
          transactionDate: new Date('2024-01-15'),
          operationId: 'op-1',
        }),
      ];

      const projections = service.projectFuturePayments(
        [loan],
        transactions,
        new Date('2024-02-01'),
        3,
      );

      expect(projections.length).toBeGreaterThan(0);
      // Balance should start from 800000 (after payment)
      expect(projections[0].remainingBalance).toBeLessThanOrEqual(800000);
    });

    it('should stop projecting when balance reaches zero', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 100000,
        monthlyPaymentAmount: 50000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE, outstandingBalance: 50000 });

      const projections = service.projectFuturePayments(
        [loan],
        [],
        new Date('2024-01-01'),
        12,
      );

      // Should not project more than necessary
      const lastProjection = projections[projections.length - 1];
      expect(lastProjection.remainingBalance).toBeLessThanOrEqual(0);
    });

    it('should handle multiple loans', () => {
      const loan1 = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan1.update({ status: LoanStatus.ACTIVE });

      const loan2 = Loan.create({
        memberId: 'member-1',
        loanType: 'business',
        approvedAmount: 500000,
        monthlyPaymentAmount: 50000,
        interestRate: 0.015,
        term: 10,
      });
      loan2.update({ status: LoanStatus.ACTIVE });

      const projections = service.projectFuturePayments(
        [loan1, loan2],
        [],
        new Date('2024-01-01'),
        3,
      );

      expect(projections.length).toBeGreaterThan(3);
      const loan1Projections = projections.filter((p) => p.loanId === loan1.id);
      const loan2Projections = projections.filter((p) => p.loanId === loan2.id);
      expect(loan1Projections.length).toBeGreaterThan(0);
      expect(loan2Projections.length).toBeGreaterThan(0);
    });

    it('should sort projections by date', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const projections = service.projectFuturePayments(
        [loan],
        [],
        new Date('2024-01-01'),
        5,
      );

      for (let i = 1; i < projections.length; i++) {
        expect(projections[i].date.getTime()).toBeGreaterThanOrEqual(
          projections[i - 1].date.getTime(),
        );
      }
    });
  });

  describe('calculateNextPaymentDate', () => {
    it('should return creation date + 1 month if no payments made', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });

      const nextDate = service.calculateNextPaymentDate(
        loan,
        [],
        new Date('2024-01-01'),
      );

      const expectedDate = new Date(loan.creationDate);
      expectedDate.setMonth(expectedDate.getMonth() + 1);
      expect(nextDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });

    it('should return last payment date + 1 month if payments exist', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });

      const transactions: LoanTransactionDetail[] = [
        LoanTransactionDetail.create({
          loanId: loan.id,
          transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
          amount: 100000,
          transactionDate: new Date('2024-01-15'),
          operationId: 'op-1',
        }),
      ];

      const nextDate = service.calculateNextPaymentDate(
        loan,
        transactions,
        new Date('2024-02-01'),
      );

      const expectedDate = new Date('2024-02-15');
      expect(nextDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });

    it('should use reference date if next payment is in the past', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });

      const transactions: LoanTransactionDetail[] = [
        LoanTransactionDetail.create({
          loanId: loan.id,
          transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
          amount: 100000,
          transactionDate: new Date('2023-12-15'),
          operationId: 'op-1',
        }),
      ];

      const referenceDate = new Date('2024-02-01');
      const nextDate = service.calculateNextPaymentDate(
        loan,
        transactions,
        referenceDate,
      );

      expect(nextDate.getTime()).toBeGreaterThanOrEqual(
        referenceDate.getTime(),
      );
    });
  });
});
