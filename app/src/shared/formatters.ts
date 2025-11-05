// Helper para formatear números y montos en formato español
export function formatNumber(value: number | undefined | null, options: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 }) {
  if (value == null || isNaN(value)) return '0.00';
  return value.toLocaleString('es-ES', options)
} 