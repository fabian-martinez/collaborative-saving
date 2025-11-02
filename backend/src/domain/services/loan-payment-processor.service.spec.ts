import { LoanPaymentProcessor } from './loan-payment-processor.service';
import { Loan } from '../../loans/entities/loan.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import {
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '../../common/constants/account-types';

describe('LoanPaymentProcessor', () => {
  let processor: LoanPaymentProcessor;

  beforeEach(() => {
    processor = new LoanPaymentProcessor();
  });

  describe('processPayment', () => {
    it('debe separar inter?s y principal correctamente', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02, // 2%
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 50,
        description: 'Pago mensual',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      expect(result.newBalance).toBeLessThan(loan.outstanding_balance);
      expect(result.ledgerSpecs).toHaveLength(2); // inter?s y principal
      expect(result.transactionSpecs).toHaveLength(2);
    });

    it('debe generar specs de LedgerEntry correctos', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 50,
        description: 'Pago mensual',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      const interestSpec = result.ledgerSpecs.find(
        (spec) => spec.accountType === INTEREST_INCOME_ACCOUNT,
      );
      const principalSpec = result.ledgerSpecs.find(
        (spec) => spec.accountType === LOANS_RECEIVABLE_ACCOUNT,
      );

      expect(interestSpec).toBeDefined();
      expect(interestSpec?.amount).toBeLessThan(0); // cr?dito (negativo)
      expect(principalSpec).toBeDefined();
      expect(principalSpec?.amount).toBeLessThan(0); // cr?dito (negativo)
      expect(interestSpec?.loanId).toBe('loan-1');
      expect(principalSpec?.loanId).toBe('loan-1');
    });

    it('debe generar specs de LoanTransactionDetail correctos', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 50,
        description: 'Pago mensual',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      const interestTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.INTEREST_PAYMENT,
      );
      const principalTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.PRINCIPAL_PAYMENT,
      );

      expect(interestTransaction).toBeDefined();
      expect(interestTransaction?.amount).toBeGreaterThan(0);
      expect(principalTransaction).toBeDefined();
      expect(principalTransaction?.amount).toBeGreaterThan(0);
      expect(interestTransaction?.loanId).toBe('loan-1');
      expect(principalTransaction?.loanId).toBe('loan-1');
    });

    it('debe calcular nuevo balance correctamente', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 50,
        description: 'Pago mensual',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      const expectedInterest = 1000 * 0.02; // 20
      const expectedPrincipal = 50 - expectedInterest; // 30
      const expectedNewBalance = 1000 - expectedPrincipal; // 970

      expect(result.newBalance).toBeCloseTo(expectedNewBalance, 2);
    });

    it('debe cambiar estado a paid cuando balance = 0', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 50,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 51, // Paga m?s de lo necesario
        description: 'Pago final',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      expect(result.newBalance).toBe(0);
      expect(result.newStatus).toBe(LoanStatus.PAID);
    });

    it('debe mantener active cuando balance > 0', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 50,
        description: 'Pago mensual',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      expect(result.newBalance).toBeGreaterThan(0);
      expect(result.newStatus).toBe(LoanStatus.ACTIVE);
    });

    it('debe manejar pago solo de inter?s', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 20, // Exactamente el inter?s
        description: 'Solo inter?s',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      const interestTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.INTEREST_PAYMENT,
      );
      const principalTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.PRINCIPAL_PAYMENT,
      );

      expect(interestTransaction?.amount).toBe(20);
      expect(principalTransaction).toBeUndefined();
      expect(result.newBalance).toBe(1000); // Balance no cambia
    });

    it('debe manejar pago solo de principal (cuando inter?s ya fue pagado)', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      // Pago mayor al inter?s debido (solo principal)
      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 100, // M?s que el inter?s de 20
        description: 'Principal despu?s de inter?s',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      const interestTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.INTEREST_PAYMENT,
      );
      const principalTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.PRINCIPAL_PAYMENT,
      );

      expect(interestTransaction?.amount).toBe(20); // Inter?s m?ximo
      expect(principalTransaction?.amount).toBe(80); // Resto va a principal
      expect(result.newBalance).toBeLessThan(1000);
    });

    it('debe manejar pago mixto (inter?s + principal)', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 50, // 20 inter?s + 30 principal
        description: 'Pago mixto',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      const interestTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.INTEREST_PAYMENT,
      );
      const principalTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.PRINCIPAL_PAYMENT,
      );

      expect(interestTransaction?.amount).toBe(20);
      expect(principalTransaction?.amount).toBe(30);
      expect(result.newBalance).toBe(970);
    });

    it('debe limitar el principal pagado al balance pendiente', () => {
      // Arrange
      const loan: Loan = {
        id: 'loan-1',
        outstanding_balance: 1000,
        interest_rate: 0.02,
        status: LoanStatus.ACTIVE,
      } as Loan;

      const payment: MemberDue = {
        type: 'loan_payment',
        amount: 2000, // M?s que el balance + inter?s
        description: 'Pago excesivo',
        referenceId: 'loan-1',
      };

      // Act
      const result = processor.processPayment(loan, payment);

      // Assert
      const expectedInterest = 1000 * 0.02; // 20
      const maxPrincipal = 1000; // Balance actual
      const expectedPrincipal = Math.min(2000 - expectedInterest, maxPrincipal);

      const principalTransaction = result.transactionSpecs.find(
        (spec) => spec.transactionType === TransactionType.PRINCIPAL_PAYMENT,
      );

      expect(principalTransaction?.amount).toBeCloseTo(expectedPrincipal, 2);
      expect(result.newBalance).toBe(0);
      expect(result.newStatus).toBe(LoanStatus.PAID);
    });
  });
});
