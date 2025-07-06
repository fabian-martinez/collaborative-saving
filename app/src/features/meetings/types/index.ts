export interface Meeting {
  id: string;
  date: string;
  status: 'active' | 'closed';
}

export const PaymentType = [
  'mandatory_contribution',
  'stock_fee',
  'loan_payment',
] as const;

export interface Payment {
  type: (typeof PaymentType)[number];
  description: string;
  amount: number;
  referenceId?: string;
} 