export interface Meeting {
  id: string;
  date: string;
  status: 'active' | 'closed';
}

export interface MemberDue {
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee' | 'insurance';
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
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee' | 'insurance';
  description: string;
  amount: number;
  referenceId?: string;
}

export interface SimplifiedRecordTransactions {
  memberId: string;
  payments: Payment[];
}

export type OperationType =
  | 'LOAN_DISBURSEMENT'
  | 'MONTHLY_PAYMENT';

export interface RevaluationPreviewResult {
  total_contributions: number;
  total_interest: number;
  total_to_distribute: number;
  details: RevaluationDetail[];
  total_mandatory_contributions?: number;
  mandatory_contributions_by_type?: Array<{
    total: number;
    mandatory_contribution_id: string;
  }>;
}

export interface RevaluationDetail {
  stock_id: string;
  type: string;
  is_guaranteed: boolean;
  previous_value: number;
  growth_from_contributions: number;
  estimated_growth_from_contributions: number;
  growth_from_interest: number;
  total_growth_per_share: number;
  new_value: number;
  dividends_generated?: number;
}

export interface DisbursementPlan {
  memberId: string;
  type: 'loan' | 'withdrawal' | 'dividend' | 'other';
  amount: number;
  status: 'pending' | 'approved' | 'delivered';
  notes?: string;
  loanId?: string;
  stockSubscriptionId?: string;
  disbursementStockRequest?: {
    stockId: string;
    stockWithdrawalQuantity: number;
  };
  newLoanRequest?: {
    memberId: string;
    amount: number;
    loanType: 'corriente' | 'agil' | 'accion';
    approvedAmount: number;
    monthlyPaymentAmount: number;
    interestRate: number;
    notes: string;
  };
}