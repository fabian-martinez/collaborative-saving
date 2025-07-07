export interface Meeting {
  id: string;
  date: string;
  status: 'active' | 'closed';
}

export interface MemberDue {
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee';
  description: string;
  amount: number;
  referenceId?: string;
  details?: {
    interest: number;
    principal: number;
    outstanding_balance: number;
  };
  monthlyContribution?: number;
  stockQuantity?: number;
}

export interface Payment {
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee';
  amount: number;
  referenceId?: string;
}

export interface SimplifiedRecordTransactions {
  memberId: string;
  payments: Payment[];
}