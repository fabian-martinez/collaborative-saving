// Helper para formatear números y montos en formato español
export function formatNumber(value: number, options: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 }) {
  return value.toLocaleString('es-ES', options)
} 