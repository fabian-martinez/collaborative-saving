export type AccountType =
  | 'CASH'
  | 'LOANS_RECEIVABLE'
  | 'INVESTMENT_IN_STOCKS'
  | 'DIVIDENDS_PAYABLE'
  | 'STOCK_CAPITAL'
  | 'REVALUATION_SURPLUS'
  | 'MEMBER_EQUITY'
  | 'INTEREST_INCOME'
  | 'FEE_INCOME'
  | 'MANDATORY_CONTRIBUTION_INCOME'
  | 'INSURANCE_INCOME'
  | 'DIVIDEND_EXPENSE'
  | 'OTHER_EXPENSES'
  | 'NOVELTY_LOSS'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: 'Cash',
  LOANS_RECEIVABLE: 'Loans Receivable',
  INVESTMENT_IN_STOCKS: 'Investment in Stocks',
  DIVIDENDS_PAYABLE: 'Dividends Payable',
  STOCK_CAPITAL: 'Stock Capital',
  REVALUATION_SURPLUS: 'Revaluation Surplus',
  MEMBER_EQUITY: 'Member Equity',
  INTEREST_INCOME: 'Interest Income',
  FEE_INCOME: 'Fee Income',
  MANDATORY_CONTRIBUTION_INCOME: 'Mandatory Contribution Income',
  INSURANCE_INCOME: 'Insurance Income',
  DIVIDEND_EXPENSE: 'Dividend Expense',
  OTHER_EXPENSES: 'Other Expenses',
  NOVELTY_LOSS: 'Novelty Loss',
}

export interface MemberOption {
  id: string
  name: string
}

export interface MeetingOption {
  id: string
  date: string
  status?: string
}

export interface OperationDTO {
  id: string
  memberId: string | null
  meetingId: string
  date: string
  type: string
  description: string
}

// Nuevo tipo para operaciones enriquecidas del backend
export interface OperationEnrichedDTO {
  id: string
  memberId: string | null
  meetingId: string
  date: string
  type: string
  description: string
  member?: {
    id: string
    name: string
  }
  ledger_entries?: LedgerEntryEnrichedDTO[]
}

export interface LedgerEntryDTO {
  id: string
  operationId: string
  accountType: AccountType
  amount: number
  description: string
  createdAt: string
  loanId?: string | null
  stockId?: string | null
  mandatoryContributionId?: string | null
  stockSubscriptionId?: string | null
}

// Nuevo tipo para asientos enriquecidos del backend
export interface LedgerEntryEnrichedDTO {
  id: string
  operationId: string
  accountType: string
  amount: number
  description: string
  createdAt: string
  operationType: string
  operationDescription: string
  operationDate: string
  memberId: string
  memberName: string
  meetingId: string
  meetingDate: string
  loanId?: string
  stockId?: string
  mandatoryContributionId?: string
  stockSubscriptionId?: string
}

export interface LedgerOperationGroup {
  operation: OperationDTO & {
    memberName: string | null
    meetingDate: string
  }
  entries: LedgerEntryDTO[]
}

export interface LedgerFilters {
  memberId?: string | undefined
  accountType?: AccountType | undefined
  meetingId?: string | undefined
  search?: string | undefined
  operationType?: string | undefined
  triggerError?: boolean
}

// Nuevo tipo para filtros del backend
export interface LedgerBackendFilters {
  q?: string
  memberId?: string
  accountType?: string
  meetingId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  operationType?: string
  search?: string
}

export interface LedgerSummary {
  accountTypeTotals: Record<AccountType, number>
  incomeTotal: number
  expenseTotal: number
}

export type GroupingMode = 'byOperation' | 'byAccount' | 'byMember' | 'byDate' | 'byMeeting'

export interface EntryRow {
  id: string
  operationId: string
  operationType: string
  operationDescription: string
  createdAt: string
  accountType: AccountType
  amount: number
  description: string
  memberId: string
  memberName: string | null
  meetingId: string
  meetingDate: string
  loanId?: string | null
  stockId?: string | null
  mandatoryContributionId?: string | null
  stockSubscriptionId?: string | null
}

// Nuevo tipo para respuestas paginadas del backend
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}

// Nuevo tipo para opciones de tipo de cuenta del backend
export interface AccountTypeOption {
  value: string
  label: string
}

export interface LedgerUITableGroup {
  id: string
  title: string
  entries: EntryRow[]
  total: number
}

export interface OperationView {
  id: string
  memberId: string | null
  meetingId: string
  date: string
  type: string
  description: string
  memberName: string | null
  meetingDate: string
}


