export interface Meeting {
  id: string;
  date: string;
  status: 'active' | 'closed';
}

export interface MemberDue {
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee' | 'insurance' | 'novelty';
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
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee' | 'insurance' | 'novelty';
  description: string;
  amount: number;
  referenceId?: string;
  noveltyComment?: string;
}

export interface SimplifiedRecordTransactions {
  memberId: string;
  payments: Payment[];
}

export type OperationType = 'LOAN_DISBURSEMENT' | 'MONTHLY_PAYMENT';

// ---- Closed meeting detail model (per plan) ----

export interface ContributionsResponse {
  data: Array<{
    memberId: string;
    memberName: string;
    mandatoryContribution: number;
    fees: number;
    insurance: number;
    loanPayments: number;
    total: number;
  }>;
  summary: {
    totalContributions: number;
    totalFees: number;
    totalInsurance: number;
    totalLoanPayments: number;
    grandTotal: number;
  };
}

export interface StockOperationsResponse {
  data: Array<{
    id: string;
    type: 'STOCK_PURCHASE' | 'STOCK_WITHDRAWAL' | 'STOCK_MODIFICATION';
    memberId: string;
    memberName: string;
    stockType: string;
    quantity: number;
    amount: number;
    paymentMethod: 'cash' | 'credit' | 'mixed';
    date: string;
  }>;
  summary: {
    totalPurchases: number;
    totalWithdrawals: number;
    totalModifications: number;
  };
}

export interface DisbursementsResponse {
  data: Array<{
    id: string;
    type: 'LOAN' | 'DIVIDEND' | 'WITHDRAWAL' | 'OTHER';
    memberId: string;
    memberName: string;
    amount: number;
    description: string;
    status: 'completed' | 'partial';
    date: string;
  }>;
  summary: {
    totalLoans: number;
    totalDividends: number;
    totalWithdrawals: number;
    totalOther: number;
    grandTotal: number;
  };
}

export interface LedgerEntriesResponse {
  data: Array<{
    id: string;
    accountType: string;
    amount: number;
    description: string;
    memberId?: string;
    loanId?: string;
    stockId?: string;
    date: string;
    debit?: number;
    credit?: number;
  }>;
  summary: {
    totalDebits: number;
    totalCredits: number;
    balance: number;
  };
}

export interface StockRevaluationHistoryItem {
  stockType: string;
  previousValue: number;
  newValue: number;
  change: number;
  changePercentage: number;
  // Optional extended fields
  totalShares?: number;
  previousTotalValue?: number;
  newTotalValue?: number;
  totalChange?: number;
  totalChangePercentage?: number;
}

export interface StockDividendItem {
  stockType: string;
  amount: number;
  beneficiaries: number;
}

export interface StockChangesSectionData {
  revaluationHistory: StockRevaluationHistoryItem[];
  dividendsGenerated: StockDividendItem[];
}

export interface MeetingDetailSummary {
  totalCollected: number;
  totalInterest: number;
  totalDisbursed: number;
  finalCashBalance: number;
  duration: string;
  participantsCount: number;
}

export interface MeetingDetail {
  meeting: {
    id: string;
    date: string;
    status: 'active' | 'closed';
    notes?: string;
  };
  summary: MeetingDetailSummary;
  contributions: ContributionsResponse;
  stockChanges: StockChangesSectionData;
  stockOperations: StockOperationsResponse;
  disbursements: DisbursementsResponse;
  ledgerEntries: LedgerEntriesResponse;
}

// ---- Existing active meeting flow types (used elsewhere) ----

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
  pendingMemberPaymentId?: string;
  stockSubscriptionId?: string;
  disbursementStockRequest?: {
    stockId: string;
    stockWithdrawalQuantity: number;
  };
  newLoanRequest?: {
    memberId: string;
    amount: number;
    loanType: 'corriente' | 'agil' | 'accion' | 'prioritario';
    approvedAmount: number;
    monthlyPaymentAmount: number;
    interestRate: number;
    notes: string;
  };
}