import { Loan } from '../../loans/entities/loan.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import {
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '../../common/constants/account-types';

export interface LedgerEntrySpec {
  accountType: string;
  amount: number;
  description?: string;
  loanId?: string;
  stockId?: string;
  mandatoryContributionId?: string;
}

export interface LoanTransactionDetailSpec {
  loanId: string;
  transactionType: TransactionType;
  amount: number;
}

export interface LoanPaymentResult {
  ledgerSpecs: LedgerEntrySpec[];
  transactionSpecs: LoanTransactionDetailSpec[];
  newBalance: number;
  newStatus: LoanStatus;
}

export class LoanPaymentProcessor {
  /**
   * Procesa un pago de pr?stamo, separando inter?s y principal,
   * y generando las especificaciones contables necesarias.
   */
  processPayment(loan: Loan, payment: MemberDue): LoanPaymentResult {
    const outstandingBalance = Number(loan.outstanding_balance);
    const interestRate = Number(loan.interest_rate);
    const paymentAmount = Number(payment.amount);

    // Calcular inter?s debido
    const interestDue = outstandingBalance * interestRate;

    // Separar inter?s y principal del pago
    const interestPaid = Math.min(paymentAmount, interestDue);
    const remainingAfterInterest = paymentAmount - interestPaid;

    // El principal pagado no puede exceder el balance pendiente
    const principalPaid = Math.min(
      remainingAfterInterest,
      outstandingBalance,
    );

    // Calcular nuevo balance
    const newBalance = Math.max(0, outstandingBalance - principalPaid);

    // Determinar nuevo estado
    const newStatus =
      newBalance === 0 ? LoanStatus.PAID : LoanStatus.ACTIVE;

    // Generar specs de LedgerEntry
    const ledgerSpecs: LedgerEntrySpec[] = [];

    if (interestPaid > 0) {
      ledgerSpecs.push({
        accountType: INTEREST_INCOME_ACCOUNT,
        amount: -interestPaid, // Cr?dito (negativo)
        description: payment.description || 'Pago de inter?s',
        loanId: loan.id,
      });
    }

    if (principalPaid > 0) {
      ledgerSpecs.push({
        accountType: LOANS_RECEIVABLE_ACCOUNT,
        amount: -principalPaid, // Cr?dito (negativo)
        description: payment.description || 'Pago de principal',
        loanId: loan.id,
      });
    }

    // Generar specs de LoanTransactionDetail
    const transactionSpecs: LoanTransactionDetailSpec[] = [];

    if (interestPaid > 0) {
      transactionSpecs.push({
        loanId: loan.id,
        transactionType: TransactionType.INTEREST_PAYMENT,
        amount: interestPaid,
      });
    }

    if (principalPaid > 0) {
      transactionSpecs.push({
        loanId: loan.id,
        transactionType: TransactionType.PRINCIPAL_PAYMENT,
        amount: principalPaid,
      });
    }

    return {
      ledgerSpecs,
      transactionSpecs,
      newBalance,
      newStatus,
    };
  }
}
