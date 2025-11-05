// Suma los montos de los ledger_entries de tipo 'CASH' de un array de operaciones
// Compatible con ambos formatos: ledgerEntries/ledger_entries y accountType/account_type
export function sumCashEntries(operations: { 
  ledger_entries?: { account_type?: string; accountType?: string; amount: number | string }[];
  ledgerEntries?: { account_type?: string; accountType?: string; amount: number | string }[];
}[]): number {
  if (!operations) return 0;
  return operations.reduce((sum, op) => {
    // Compatibilidad con ambos formatos
    const entries = op.ledgerEntries || op.ledger_entries;
    if (!entries) return sum;
    
    const cashSum = entries
      .filter(entry => {
        const accountType = entry.accountType || entry.account_type;
        return accountType === 'CASH';
      })
      .reduce((acc, entry) => acc + (Number(entry.amount) || 0), 0);
    return sum + cashSum;
  }, 0);
}

// Suma los montos de un array de ledger_entries de tipo 'CASH'
export function sumCashFromEntries(entries: { account_type: string; amount: number | string }[]): number {
  if (!entries) return 0;
  return entries
    .filter(entry => entry.account_type === 'CASH')
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
}

/**
 * Convierte una cadena de snake_case a camelCase
 * Ejemplo: 'monthly_contribution' -> 'monthlyContribution'
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Normaliza un objeto o array convirtiendo todas las propiedades de snake_case a camelCase
 * Maneja objetos anidados y arrays recursivamente.
 * Si el objeto ya está en camelCase, no lo modifica (idempotente).
 * 
 * @param obj - El objeto o array a normalizar
 * @returns El objeto normalizado con propiedades en camelCase
 */
export function normalizeToCamelCase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es un array, normalizar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeToCamelCase(item)) as T;
  }

  // Si es un objeto plano (no Date, no primitivos)
  if (typeof obj === 'object' && obj.constructor === Object) {
    const normalized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Convertir la clave de snake_case a camelCase
      const camelKey = snakeToCamel(key);
      
      // Normalizar recursivamente el valor
      normalized[camelKey] = normalizeToCamelCase(value);
    }
    
    return normalized as T;
  }

  // Para primitivos, Date, etc., devolver tal cual
  return obj;
} 