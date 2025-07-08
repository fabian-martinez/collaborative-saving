export interface MemberDue {
  type:
    | 'mandatory_contribution'
    | 'stock_fee'
    | 'loan_payment'
    | 'fee'
    | 'insurance';
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
