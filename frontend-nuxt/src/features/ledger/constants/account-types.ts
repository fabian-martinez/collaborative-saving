export type AccountType =
  | 'CASH'
  | 'LOANS_RECEIVABLE'
  | 'INVESTMENT_IN_STOCKS'
  | 'DIVIDENDS_PAYABLE'
  | 'STOCK_CAPITAL'
  | 'STOCK_TRANSFER'
  | 'REVALUATION_SURPLUS'
  | 'MEMBER_EQUITY'
  | 'ACCUMULATED_SURPLUS'
  | 'INTEREST_INCOME'
  | 'FEE_INCOME'
  | 'MANDATORY_CONTRIBUTION_INCOME'
  | 'INSURANCE_INCOME'
  | 'DIVIDEND_EXPENSE'
  | 'OTHER_EXPENSES'
  | 'NOVELTY_LOSS'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: 'Caja General',
  LOANS_RECEIVABLE: 'Cartera de Préstamos',
  INVESTMENT_IN_STOCKS: 'Inversión en Acciones',
  DIVIDENDS_PAYABLE: 'Dividendos por Pagar',
  STOCK_CAPITAL: 'Capital Social',
  STOCK_TRANSFER: 'Transferencia de Acciones',
  REVALUATION_SURPLUS: 'Superávit por Revalorización',
  MEMBER_EQUITY: 'Patrimonio del Socio',
  ACCUMULATED_SURPLUS: 'Utilidades Acumuladas',
  INTEREST_INCOME: 'Ingresos por Intereses',
  FEE_INCOME: 'Ingresos por Otros',
  MANDATORY_CONTRIBUTION_INCOME: 'Aportes Obligatorios',
  INSURANCE_INCOME: 'Ingresos por Seguro',
  DIVIDEND_EXPENSE: 'Gastos por Dividendos',
  OTHER_EXPENSES: 'Gastos Administrativos',
  NOVELTY_LOSS: 'Provisión Cartera Incobrable'
}

export const ASSET_ACCOUNTS: AccountType[] = [
  'CASH',
  'LOANS_RECEIVABLE',
  'INVESTMENT_IN_STOCKS',
  'DIVIDENDS_PAYABLE'
]

export const EQUITY_ACCOUNTS: AccountType[] = [
  'STOCK_CAPITAL',
  'REVALUATION_SURPLUS',
  'ACCUMULATED_SURPLUS',
  'MEMBER_EQUITY'
]

export const INCOME_ACCOUNTS: AccountType[] = [
  'INTEREST_INCOME',
  'FEE_INCOME',
  'MANDATORY_CONTRIBUTION_INCOME',
  'INSURANCE_INCOME'
]

export const EXPENSE_ACCOUNTS: AccountType[] = [
  'DIVIDEND_EXPENSE',
  'OTHER_EXPENSES',
  'NOVELTY_LOSS'
]

export type AccountCategory = 'activos' | 'pasivos' | 'patrimonio' | 'ingresos' | 'gastos'

export function getAccountCategory(accountType: AccountType): AccountCategory | null {
  if (ASSET_ACCOUNTS.includes(accountType)) return 'activos'
  if (EQUITY_ACCOUNTS.includes(accountType)) return 'patrimonio'
  if (INCOME_ACCOUNTS.includes(accountType)) return 'ingresos'
  if (EXPENSE_ACCOUNTS.includes(accountType)) return 'gastos'
  return null
}
