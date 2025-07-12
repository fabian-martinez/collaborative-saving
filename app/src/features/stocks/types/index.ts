export interface Stock {
  id: string;
  type: string;
  value: number;
  monthly_contribution: number;
} 

export interface StocksForPurchase {
  memberId: string;
  stockId: string;
  quantity: number;
  cashAmount: number;
  loanDetails?: {
    interest_rate: number;
    loan_type: string;
  } | undefined;
}