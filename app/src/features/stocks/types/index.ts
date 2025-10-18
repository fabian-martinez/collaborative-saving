export type StockBehavior = 'CAPITAL_APPRECIATION' | 'DIVIDEND_YIELD';

export interface Stock {
  id: string;
  type: string;
  value: number;
  monthly_contribution: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  subscriptionCount?: number;
}

export interface StockHistoryPoint {
  date: string;
  meetingId: string;
  stockType: string;
  quantity: number;
  change: number;
  operations: string[];
  changeDescription: string;
}

export interface StockHistoryData {
  stockType: string;
  history: StockHistoryPoint[];
  currentQuantity: number;
  totalOperations: number;
  initialQuantity: number;
}

export interface StockHistoryRequest {
  stockType?: string;
  includeTransfers?: boolean;
  includeLoanPayments?: boolean;
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