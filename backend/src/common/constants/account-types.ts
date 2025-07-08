// --- ACTIVOS ---
// Representan lo que el fondo posee o se le debe.

// Activos Corrientes (Líquidos)
export const CASH_ACCOUNT = 'CASH'; // Dinero en efectivo o en banco.

// Cuentas por Cobrar
export const LOANS_RECEIVABLE_ACCOUNT = 'LOANS_RECEIVABLE'; // Dinero que los socios deben al fondo por préstamos.

// Inversiones
export const INVESTMENT_IN_STOCKS_ACCOUNT = 'INVESTMENT_IN_STOCKS'; // Valor de las acciones que posee el fondo. Aumenta con la revalorización.

// --- PATRIMONIO Y CAPITAL ---
// Representan el valor que pertenece a los socios.
export const STOCK_CAPITAL_ACCOUNT = 'STOCK_CAPITAL'; // Capital aportado por los socios al comprar acciones.
export const REVALUATION_SURPLUS_ACCOUNT = 'REVALUATION_SURPLUS'; // Ganancias no realizadas por el aumento de valor de los activos.

// --- INGRESOS ---
// Representan las ganancias del fondo.
export const INTEREST_INCOME_ACCOUNT = 'INTEREST_INCOME'; // Ganancias generadas por los intereses de los préstamos.
export const FEE_INCOME_ACCOUNT = 'FEE_INCOME'; // Ingresos por multas u otras tarifas.
export const MANDATORY_CONTRIBUTION_INCOME_ACCOUNT =
  'MANDATORY_CONTRIBUTION_INCOME'; // Ingresos por las cuotas obligatorias de los socios.
export const INSURANCE_INCOME_ACCOUNT = 'INSURANCE_INCOME'; // Ingresos por el seguro de deuda.

// Cuenta temporal para transacciones no clasificadas durante el desarrollo
export const PENDING_CLASSIFICATION_ACCOUNT = 'PENDING_CLASSIFICATION';
