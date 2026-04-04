/**
 * Utilidades para formateo de datos
 */

// Cache formatters to avoid expensive re-instantiation
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const numberFormatters = new Map<number, Intl.NumberFormat>()

function getNumberFormatter(decimals: number): Intl.NumberFormat {
  let formatter = numberFormatters.get(decimals)
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    numberFormatters.set(decimals, formatter)
  }
  return formatter
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

export function formatCurrency(amount: number | string | null | undefined): string {
  // Handle null, undefined, or invalid values
  if (amount == null || amount === undefined || amount === '') {
    return '$ 0'
  }
  
  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Handle NaN or invalid numbers
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return '$ 0'
  }
  
  return currencyFormatter.format(numAmount)
}

export function formatNumber(value: number, decimals: number = 2): string {
  return getNumberFormatter(decimals).format(value)
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value * 100, decimals)}%`
}

export function formatDate(date: string | Date | null | undefined): string {
  // Handle null, undefined, or empty string
  if (date == null || date === undefined || date === '') {
    return 'N/A'
  }
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(d.getTime()) || !isFinite(d.getTime())) {
    return 'N/A'
  }
  
  try {
    return dateFormatter.format(d)
  } catch (error) {
    return 'N/A'
  }
}

export function formatDateFullSpanish(date: string | Date | null | undefined): string {
  // Handle null, undefined, or empty string
  if (date == null || date === undefined || date === '') {
    return 'N/A'
  }
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(d.getTime()) || !isFinite(d.getTime())) {
    return 'N/A'
  }
  
  try {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    const dayName = days[d.getDay()]
    const day = d.getDate()
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${dayName}, ${day} de ${month} ${year}`
  } catch (error) {
    return 'N/A'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  // Handle null, undefined, or empty string
  if (date == null || date === undefined || date === '') {
    return 'N/A'
  }
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(d.getTime()) || !isFinite(d.getTime())) {
    return 'N/A'
  }
  
  try {
    return dateTimeFormatter.format(d)
  } catch (error) {
    return 'N/A'
  }
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
