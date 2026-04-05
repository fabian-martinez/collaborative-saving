/**
 * Utilidades para validación
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isPositiveNumber(value: number): boolean {
  return value > 0 && !isNaN(value)
}

export function isNonNegativeNumber(value: number): boolean {
  return value >= 0 && !isNaN(value)
}

export function isValidPercentage(value: number): boolean {
  return value >= 0 && value <= 1 && !isNaN(value)
}
