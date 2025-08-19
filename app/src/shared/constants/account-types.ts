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
export const REVALUATION_SURPLUS_ACCOUNT = 'REVALUATION_SURPLUS'; // Ganancias no realizadas por el aumento de valor de los activos.
export const MEMBER_EQUITY_ACCOUNT = 'MEMBER_EQUITY'; // Capital/patrimonio del socio para préstamos sin afectar efectivo.

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
export const PENDING_CLASSIFICATION_ACCOUNT = 'PENDING_CLASSIFICATION';

// Cuenta para registrar pérdidas por novedades que afectan negativamente el recaudo
export const NOVELTY_LOSS_ACCOUNT = 'NOVELTY_LOSS';
