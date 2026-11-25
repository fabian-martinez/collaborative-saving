export const DUE_TYPE_LABELS: Record<string, string> = {
  mandatory_contribution: 'Aporte obligatorio',
  stock_fee: 'Cuota de acción',
  loan_payment: 'Pago de préstamo',
  insurance: 'Seguro',
  fee: 'Cuota',
  novelty: 'Novedad'
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  LOANS_RECEIVABLE: 'Préstamos por Cobrar',
  INVESTMENT_IN_STOCKS: 'Inversión en Acciones',
  DIVIDENDS_PAYABLE: 'Dividendos por Pagar',
  STOCK_CAPITAL: 'Capital de Acciones',
  STOCK_TRANSFER: 'Transferencia de Acciones',
  REVALUATION_SURPLUS: 'Superávit de Revalorización',
  MEMBER_EQUITY: 'Patrimonio del Socio',
  ACCUMULATED_SURPLUS: 'Superávit Acumulado',
  INTEREST_INCOME: 'Intereses Pagados',
  FEE_INCOME: 'Multas y Recargos',
  MANDATORY_CONTRIBUTION_INCOME: 'Cuotas Obligatorias',
  INSURANCE_INCOME: 'Seguro',
  DIVIDEND_EXPENSE: 'Gastos por Dividendos',
  OTHER_EXPENSES: 'Otros Gastos',
  NOVELTY_LOSS: 'Novedades'
}

const CREDIT_NORMAL_ACCOUNTS = new Set([
  'DIVIDENDS_PAYABLE',
  'STOCK_CAPITAL',
  'STOCK_TRANSFER',
  'REVALUATION_SURPLUS',
  'MEMBER_EQUITY',
  'ACCUMULATED_SURPLUS',
  'INTEREST_INCOME',
  'FEE_INCOME',
  'MANDATORY_CONTRIBUTION_INCOME',
  'INSURANCE_INCOME'
])

/**
 * Formats a technical due or payment type key into a readable Spanish label.
 */
export function formatDueOrPaymentType(type: string): string {
  return DUE_TYPE_LABELS[type] ?? type
}

/**
 * Formats a ledger account_type key into a readable Spanish label.
 */
export function formatAccountType(accountType: string): string {
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType
}

/**
 * Returns true for credit-normal accounts where income/equity contributions are stored as negative amounts.
 */
export function isCreditNormalAccount(accountType: string): boolean {
  return CREDIT_NORMAL_ACCOUNTS.has(accountType)
}

/**
 * Adds one calendar month to a date string/Date, clamping day-of-month if needed.
 */
export function addOneMonth(dateInput: string | Date): Date {
  const base = new Date(dateInput)
  if (isNaN(base.getTime())) {
    const fallback = new Date()
    fallback.setMonth(fallback.getMonth() + 1)
    return fallback
  }
  const result = new Date(base.getTime())
  const originalDay = result.getDate()
  result.setMonth(result.getMonth() + 1)
  if (result.getDate() !== originalDay) {
    result.setDate(0)
  }
  return result
}
