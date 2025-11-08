// --- ACTIVOS ---
// Representan lo que el fondo posee o se le debe.

// Activos Corrientes (Líquidos)
export const CASH_ACCOUNT = 'CASH'; // Dinero en efectivo o en banco.

// Cuentas por Cobrar
export const LOANS_RECEIVABLE_ACCOUNT = 'LOANS_RECEIVABLE'; // Dinero que los socios deben al fondo por préstamos.

// Inversiones
export const INVESTMENT_IN_STOCKS_ACCOUNT = 'INVESTMENT_IN_STOCKS'; // Valor de las acciones que posee el fondo. Aumenta con la revalorización.
export const DIVIDENDS_PAYABLE_ACCOUNT = 'DIVIDENDS_PAYABLE'; // Dividendos por pagar a los socios.

// --- PATRIMONIO Y CAPITAL ---
// Representan el valor que pertenece a los socios.
export const STOCK_CAPITAL_ACCOUNT = 'STOCK_CAPITAL'; // Capital aportado por los socios al comprar acciones.
export const STOCK_TRANSFER_ACCOUNT = 'STOCK_TRANSFER'; // Cuenta puente para transferencias de acciones entre socios.
export const REVALUATION_SURPLUS_ACCOUNT = 'REVALUATION_SURPLUS'; // Ganancias no realizadas por el aumento de valor de los activos.
export const MEMBER_EQUITY_ACCOUNT = 'MEMBER_EQUITY'; // Capital/patrimonio del socio para préstamos sin afectar efectivo.
export const ACCUMULATED_SURPLUS_ACCOUNT = 'ACCUMULATED_SURPLUS'; // Superávit acumulado de reuniones anteriores.

// --- INGRESOS ---
// Representan las ganancias del fondo.
export const INTEREST_INCOME_ACCOUNT = 'INTEREST_INCOME'; // Ganancias generadas por los intereses de los préstamos.
export const FEE_INCOME_ACCOUNT = 'FEE_INCOME'; // Ingresos por multas u otras tarifas.
export const MANDATORY_CONTRIBUTION_INCOME_ACCOUNT =
  'MANDATORY_CONTRIBUTION_INCOME'; // Ingresos por las cuotas obligatorias de los socios.
export const INSURANCE_INCOME_ACCOUNT = 'INSURANCE_INCOME'; // Ingresos por el seguro de deuda.

// --- GASTOS ---
// Representan los gastos del fondo.
export const DIVIDEND_EXPENSE_ACCOUNT = 'DIVIDEND_EXPENSE'; // Gastos por pago de dividendos a los socios.
export const OTHER_EXPENSES_ACCOUNT = 'OTHER_EXPENSES'; // Otros gastos del fondo.

// Cuenta temporal para transacciones no clasificadas durante el desarrollo
export const NOVELTY_LOSS_ACCOUNT = 'NOVELTY_LOSS';

// Tipo TypeScript para todos los tipos de cuenta
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
  | 'NOVELTY_LOSS';

// Array con todos los tipos de cuenta
export const ALL_ACCOUNT_TYPES: AccountType[] = [
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  INVESTMENT_IN_STOCKS_ACCOUNT,
  DIVIDENDS_PAYABLE_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  STOCK_TRANSFER_ACCOUNT,
  REVALUATION_SURPLUS_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
  ACCUMULATED_SURPLUS_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  FEE_INCOME_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  INSURANCE_INCOME_ACCOUNT,
  DIVIDEND_EXPENSE_ACCOUNT,
  OTHER_EXPENSES_ACCOUNT,
  NOVELTY_LOSS_ACCOUNT,
];

// Objeto con todas las constantes organizadas por categoría
export const ACCOUNT_TYPES = {
  // Activos
  ASSETS: {
    CASH: CASH_ACCOUNT,
    LOANS_RECEIVABLE: LOANS_RECEIVABLE_ACCOUNT,
    INVESTMENT_IN_STOCKS: INVESTMENT_IN_STOCKS_ACCOUNT,
    DIVIDENDS_PAYABLE: DIVIDENDS_PAYABLE_ACCOUNT,
  },
  // Patrimonio y Capital
  EQUITY: {
    STOCK_CAPITAL: STOCK_CAPITAL_ACCOUNT,
    STOCK_TRANSFER: STOCK_TRANSFER_ACCOUNT,
    REVALUATION_SURPLUS: REVALUATION_SURPLUS_ACCOUNT,
    MEMBER_EQUITY: MEMBER_EQUITY_ACCOUNT,
    ACCUMULATED_SURPLUS: ACCUMULATED_SURPLUS_ACCOUNT,
  },
  // Ingresos
  INCOME: {
    INTEREST: INTEREST_INCOME_ACCOUNT,
    FEE: FEE_INCOME_ACCOUNT,
    MANDATORY_CONTRIBUTION: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
    INSURANCE: INSURANCE_INCOME_ACCOUNT,
  },
  // Gastos
  EXPENSES: {
    DIVIDEND: DIVIDEND_EXPENSE_ACCOUNT,
    OTHER: OTHER_EXPENSES_ACCOUNT,
  },
  // Otros
  OTHER: {
    NOVELTY_LOSS: NOVELTY_LOSS_ACCOUNT,
  },
} as const;

// Etiquetas en español para cada tipo de cuenta
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [CASH_ACCOUNT]: 'Efectivo',
  [LOANS_RECEIVABLE_ACCOUNT]: 'Préstamos por Cobrar',
  [INVESTMENT_IN_STOCKS_ACCOUNT]: 'Inversión en Acciones',
  [DIVIDENDS_PAYABLE_ACCOUNT]: 'Dividendos por Pagar',
  [STOCK_CAPITAL_ACCOUNT]: 'Capital en Acciones',
  [STOCK_TRANSFER_ACCOUNT]: 'Transferencia de Acciones',
  [REVALUATION_SURPLUS_ACCOUNT]: 'Superávit de Revalorización',
  [MEMBER_EQUITY_ACCOUNT]: 'Patrimonio del Socio',
  [ACCUMULATED_SURPLUS_ACCOUNT]: 'Superávit Acumulado',
  [INTEREST_INCOME_ACCOUNT]: 'Ingresos por Intereses',
  [FEE_INCOME_ACCOUNT]: 'Ingresos por Multas',
  [MANDATORY_CONTRIBUTION_INCOME_ACCOUNT]:
    'Ingresos por Contribuciones Obligatorias',
  [INSURANCE_INCOME_ACCOUNT]: 'Ingresos por Seguro',
  [DIVIDEND_EXPENSE_ACCOUNT]: 'Gastos por Dividendos',
  [OTHER_EXPENSES_ACCOUNT]: 'Otros Gastos',
  [NOVELTY_LOSS_ACCOUNT]: 'Pérdida por Novedades',
};

// Etiquetas en inglés para cada tipo de cuenta
export const ACCOUNT_TYPE_LABELS_EN: Record<AccountType, string> = {
  [CASH_ACCOUNT]: 'Cash',
  [LOANS_RECEIVABLE_ACCOUNT]: 'Loans Receivable',
  [INVESTMENT_IN_STOCKS_ACCOUNT]: 'Investment in Stocks',
  [DIVIDENDS_PAYABLE_ACCOUNT]: 'Dividends Payable',
  [STOCK_CAPITAL_ACCOUNT]: 'Stock Capital',
  [STOCK_TRANSFER_ACCOUNT]: 'Stock Transfer',
  [REVALUATION_SURPLUS_ACCOUNT]: 'Revaluation Surplus',
  [MEMBER_EQUITY_ACCOUNT]: 'Member Equity',
  [ACCUMULATED_SURPLUS_ACCOUNT]: 'Accumulated Surplus',
  [INTEREST_INCOME_ACCOUNT]: 'Interest Income',
  [FEE_INCOME_ACCOUNT]: 'Fee Income',
  [MANDATORY_CONTRIBUTION_INCOME_ACCOUNT]: 'Mandatory Contribution Income',
  [INSURANCE_INCOME_ACCOUNT]: 'Insurance Income',
  [DIVIDEND_EXPENSE_ACCOUNT]: 'Dividend Expense',
  [OTHER_EXPENSES_ACCOUNT]: 'Other Expenses',
  [NOVELTY_LOSS_ACCOUNT]: 'Novelty Loss',
};
