// --- ACTIVOS ---
// Representan lo que el fondo posee o se le debe.

// Activos Corrientes (Líquidos)
export const CASH_ACCOUNT = 'CASH'; // Dinero en efectivo o en banco.

// Cuentas por Cobrar
export const LOANS_RECEIVABLE_ACCOUNT = 'LOANS_RECEIVABLE'; // Dinero que los socios deben al fondo por préstamos.

// --- PATRIMONIO Y CAPITAL ---
// Representan el valor que pertenece a los socios.
export const STOCK_CAPITAL_ACCOUNT = 'STOCK_CAPITAL'; // Capital aportado por los socios al comprar acciones.

// --- INGRESOS ---
// Representan las ganancias del fondo.
export const INTEREST_INCOME_ACCOUNT = 'INTEREST_INCOME'; // Ganancias generadas por los intereses de los préstamos.
export const MANDATORY_CONTRIBUTION_INCOME_ACCOUNT =
  'MANDATORY_CONTRIBUTION_INCOME'; // Ingresos por las cuotas obligatorias de los socios.

// Cuenta temporal para transacciones no clasificadas durante el desarrollo
export const PENDING_CLASSIFICATION_ACCOUNT = 'PENDING_CLASSIFICATION';
