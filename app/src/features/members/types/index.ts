// Base Member interface
export interface Member {
  id: string;
  name: string;
  email: string | null;
  identificationNumber: string | null;
  role: string;
  status: string;
  address?: string | null;
  phone?: string | null;
  beneficiary?: string | null;
  registrationDate: string;
  deletedAt?: string | null;
  createdAt?: string | null;
}

// Member Detail Response
export interface MemberDetailResponse {
  id: string;
  name: string;
  email: string | null;
  identificationNumber: string | null;
  role: string;
  status: string;
  address?: string | null;
  phone?: string | null;
  beneficiary?: string | null;
  registrationDate: string;
}

// Stock interfaces
export interface Stock {
  id: string;
  name: string;
  quantity: number;
  value: number;
  nominalValue: number;
  requiredContribution: number;
}

export interface MemberStocksResponse {
  memberId: string;
  memberName: string;
  stocks: Stock[];
  totalValue: number;
  totalMonthlyContribution: number;
}

// Loan interfaces
export interface Loan {
  id: string;
  loanType: string;
  approvedAmount: number;
  monthlyPaymentAmount: number;
  outstandingBalance: number;
  interestRate: number;
  term: number;
  status: string;
  creationDate: string;
}

export interface MemberLoansResponse {
  memberId: string;
  memberName: string;
  loans: Loan[];
  totalApprovedAmount: number;
  totalOutstandingBalance: number;
  totalMonthlyPayment: number;
}

// Debt Capacity interfaces
export interface DebtCapacityResponse {
  memberId: string;
  memberName: string;
  totalSavings: number;
  totalCredits: number;
  availableCapacity: number;
  totalCapacity: number;
  utilization: number;
  creditStatus: 'excellent' | 'good' | 'moderate' | 'high';
  calculatedAt: Date;
}

// Stock Transaction interfaces
export interface StockTransaction {
  id: string;
  date: Date;
  period: string;
  description: string;
  amount: number;
  status: string;
  operationType: string;
}

export interface StockTransactionHistory {
  stockId: string;
  stockName: string;
  memberId: string;
  memberName: string;
  nominalValue?: number;
  requiredContribution?: number;
  transactions: StockTransaction[];
  totalAmount: number;
}

// Loan Installment interfaces
export interface LoanInstallment {
  id: string;
  installmentNumber: number;
  dueDate: Date;
  paymentDate?: Date;
  principal: number;
  interest: number;
  total: number;
  status: string;
  amountPaid?: number;
}

export interface LoanInstallments {
  loanId: string;
  memberId: string;
  memberName: string;
  loanAmount: number;
  term: number;
  interestRate: number;
  installments: LoanInstallment[];
  totalPaid: number;
  totalPending: number;
  outstandingBalance: number;
}

// Transaction interfaces
export interface Transaction {
  id: string;
  date: Date;
  description: string;
  operationType: string;
  accountType: string;
  stockId?: string;
  loanId?: string;
}

export interface MemberTransactionsResponse {
  memberId: string;
  memberName: string;
  transactions: Transaction[];
  totalTransactions: number;
}

// Member Summary interface
export interface MemberSummaryResponse {
  member: MemberDetailResponse;
  stocks: MemberStocksResponse;
  loans: MemberLoansResponse;
  debtCapacity: DebtCapacityResponse;
  lastUpdated: Date;
}

// Organization interfaces
export interface OrganizationDebtCapacityStats {
  totalMembers: number;
  totalSavings: number;
  totalCredits: number;
  averageUtilization: number;
  membersByCreditStatus: {
    excellent: number;
    good: number;
    moderate: number;
    high: number;
  };
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
} 