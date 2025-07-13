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