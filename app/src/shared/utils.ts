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

/**
 * Convierte una cadena de camelCase a snake_case
 * Ejemplo: 'monthlyContribution' -> 'monthly_contribution'
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convierte un objeto o array de camelCase a snake_case
 * Maneja objetos anidados y arrays recursivamente.
 * 
 * @param obj - El objeto o array a convertir
 * @returns El objeto convertido con propiedades en snake_case
 */
export function normalizeToSnakeCase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es un array, convertir cada elemento
  if (Array.isArray(obj)) {
    // #region agent log
    if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null && 'amount' in obj[0]) {
      const totalBefore = (obj as any[]).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
      const logBeforeNormalize = {location:'utils.ts:98',message:'Before normalizing array to snake_case',data:{arrayLength:obj.length,totalAmount:totalBefore},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG]', logBeforeNormalize);
      fetch('http://127.0.0.1:7242/ingest/19720b58-fc2b-4eb6-83b3-0fb7d6fdf01a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logBeforeNormalize)}).catch(()=>{});
    }
    // #endregion
    const result = obj.map(item => normalizeToSnakeCase(item)) as T;
    // #region agent log
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object' && result[0] !== null && 'amount' in result[0]) {
      const totalAfter = (result as any[]).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
      const logAfterNormalize = {location:'utils.ts:105',message:'After normalizing array to snake_case',data:{arrayLength:result.length,totalAmount:totalAfter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG]', logAfterNormalize);
      fetch('http://127.0.0.1:7242/ingest/19720b58-fc2b-4eb6-83b3-0fb7d6fdf01a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logAfterNormalize)}).catch(()=>{});
    }
    // #endregion
    return result;
  }

  // Si es un objeto plano (no Date, no primitivos)
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Convertir la clave de camelCase a snake_case
      const snakeKey = camelToSnake(key);
      
      // Convertir recursivamente el valor
      converted[snakeKey] = normalizeToSnakeCase(value);
    }
    
    return converted as T;
  }

  // Para primitivos, Date, etc., devolver tal cual
  return obj;
} 