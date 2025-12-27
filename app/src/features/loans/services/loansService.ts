import { api } from '@/services/api';

export interface Loan {
  id: string;
  member_id: string;
  loan_type: string;
  approved_amount: number;
  monthly_payment_amount: number;
  outstanding_balance: number;
  due_installments: number;
  payment_status_this_month: 'PAID' | 'PENDING' | 'OVERDUE' | 'INACTIVE';
  interest_rate: number;
  status: string;
  creation_date: string;
}

export interface DebtCapacity {
  maxAmount: number | null;
  availableCapital: number;
  description: string;
}

export interface DebtCapacitiesByType {
  corriente?: DebtCapacity;
  agil?: DebtCapacity;
  accion?: DebtCapacity;
  normal?: DebtCapacity;
  [key: string]: DebtCapacity | undefined;
}

export const loansService = {
  getLoansByMember: async (memberId: string): Promise<Loan[]> => {
    const loans = await api.get<Loan[]>(`/loans/member/${memberId}`);
    return loans.map(loan => ({
      ...loan,
      approved_amount: Number(loan.approved_amount),
      monthly_payment_amount: Number(loan.monthly_payment_amount),
      outstanding_balance: Number(loan.outstanding_balance),
      due_installments: Number(loan.due_installments),
      interest_rate: Number(loan.interest_rate)
    }));
  },

  getActiveLoansByMember: async (memberId: string): Promise<Loan[]> => {
    const loans = await api.get<Loan[]>(`/loans/member/${memberId}/active`);
    const mappedLoans = loans.map(loan => {
      // El API normaliza a camelCase, pero la interfaz usa snake_case
      // Intentar ambos nombres para compatibilidad
      const outstandingBalance = (loan as any).outstandingBalance ?? loan.outstanding_balance;
      const approvedAmount = (loan as any).approvedAmount ?? loan.approved_amount;
      const monthlyPaymentAmount = (loan as any).monthlyPaymentAmount ?? loan.monthly_payment_amount;
      const dueInstallments = (loan as any).dueInstallments ?? loan.due_installments;
      const interestRate = (loan as any).interestRate ?? loan.interest_rate;
      return {
        ...loan,
        approved_amount: Number(approvedAmount),
        monthly_payment_amount: Number(monthlyPaymentAmount),
        outstanding_balance: Number(outstandingBalance),
        due_installments: Number(dueInstallments),
        interest_rate: Number(interestRate)
      };
    });
    return mappedLoans;
  },

  getDebtCapacitiesByMember: async (memberId: string): Promise<DebtCapacitiesByType> => {
    return api.get<DebtCapacitiesByType>(`/loans/member/${memberId}/capacity`);
  }
}; 