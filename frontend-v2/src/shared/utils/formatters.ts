/**
 * Utilidades para formateo de datos
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value * 100, decimals)}%`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function formatAccountType(accountType: string): string {
  const types: Record<string, string> = {
    CASH: 'Efectivo',
    LOANS_RECEIVABLE: 'Préstamos por Cobrar',
    LOAN_PORTFOLIO: 'Cartera de Préstamos',
    INTEREST_INCOME: 'Ingresos por Intereses',
    STOCK_PORTFOLIO: 'Cartera de Acciones',
    MANDATORY_CONTRIBUTIONS: 'Aportes Obligatorios',
    ACCUMULATED_SURPLUS: 'Superávit Acumulado',
    NOVELTY_LOSS: 'Pérdida por Novedad'
  }
  return types[accountType] || accountType
}

export function formatCurrencyCompact(amount: number): string {
  const absAmount = Math.abs(amount)
  
  if (absAmount >= 1000000000000) {
    // Trillones
    return `$${(absAmount / 1000000000000).toFixed(2)}T`
  } else if (absAmount >= 1000000000) {
    // Billones
    return `$${(absAmount / 1000000000).toFixed(2)}B`
  } else if (absAmount >= 1000000) {
    // Millones
    return `$${(absAmount / 1000000).toFixed(2)}M`
  } else if (absAmount >= 1000) {
    // Miles
    return `$${(absAmount / 1000).toFixed(2)}K`
  } else {
    // Menos de mil
    return formatCurrency(amount)
  }
}

// Formatea un número para mostrar en un input de dinero con puntos como separadores de miles
export function formatMoneyInput(value: number | null | undefined): string {
  if (value == null || value === undefined || isNaN(value)) return '';
  // Convierte a string y formatea con puntos como separadores de miles
  // No incluye decimales por defecto para el input
  const parts = value.toString().split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] ? ',' + parts[1] : '';
  return integerPart + decimalPart;
}

// Parsea un string formateado con puntos de miles y convierte a número
export function parseMoneyInput(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remueve todos los puntos (separadores de miles) 
  // Si hay una coma, la reemplaza por punto (separador decimal)
  // Si hay múltiples comas, solo la última se considera como separador decimal
  let cleaned = value.replace(/\./g, '');
  const lastCommaIndex = cleaned.lastIndexOf(',');
  if (lastCommaIndex !== -1) {
    // Remover todas las comas y poner un punto solo en la posición de la última coma
    cleaned = cleaned.substring(0, lastCommaIndex).replace(/,/g, '') + '.' + cleaned.substring(lastCommaIndex + 1);
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

