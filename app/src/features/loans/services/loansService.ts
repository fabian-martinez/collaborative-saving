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
    return loans.map(loan => ({
      ...loan,
      approved_amount: Number(loan.approved_amount),
      monthly_payment_amount: Number(loan.monthly_payment_amount),
      outstanding_balance: Number(loan.outstanding_balance),
      due_installments: Number(loan.due_installments),
      interest_rate: Number(loan.interest_rate)
    }));
  },

  getDebtCapacitiesByMember: async (memberId: string): Promise<DebtCapacitiesByType> => {
    return api.get<DebtCapacitiesByType>(`/loans/member/${memberId}/capacity`);
  }
}; 