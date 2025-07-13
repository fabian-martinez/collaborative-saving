export type StockBehavior = 'CAPITAL_APPRECIATION' | 'DIVIDEND_YIELD';

export interface Stock {
  id: string;
  type: string;
  value: number;
  monthly_contribution: number;
  behavior: StockBehavior;
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