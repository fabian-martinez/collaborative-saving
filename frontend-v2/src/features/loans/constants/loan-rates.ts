/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export type LoanType = 'corriente' | 'agil' | 'accion' | 'prioritario'

export const DEFAULT_LOAN_INTEREST_RATES: Record<LoanType, number> = {
  corriente: 0.015,
  accion: 0.015,
  agil: 0.02,
  prioritario: 0.02,
}

export const DEFAULT_LOAN_INTEREST_PERCENTAGES: Record<LoanType, number> = {
  corriente: 1.5,
  accion: 1.5,
  agil: 2.0,
  prioritario: 2.0,
}

export const LOAN_TYPE_OPTIONS: Array<{ value: LoanType; label: string }> = [
  { value: 'corriente', label: 'Corriente (1.5%)' },
  { value: 'agil', label: 'Ágil (2%)' },
  { value: 'prioritario', label: 'Prioritario (2%)' },
  { value: 'accion', label: 'Acción (1.5%)' },
]

/**
 * Returns the default interest rate as a decimal (e.g., 0.015 for 1.5%, 0.02 for 2.0%)
 */
export function getDefaultInterestRate(type?: string | null): number {
  if (type && type in DEFAULT_LOAN_INTEREST_RATES) {
    return DEFAULT_LOAN_INTEREST_RATES[type as LoanType]
  }
  return 0.02
}

/**
 * Returns the default interest rate as a percentage (e.g., 1.5 for 1.5%, 2.0 for 2.0%)
 */
export function getDefaultInterestPercentage(type?: string | null): number {
  if (type && type in DEFAULT_LOAN_INTEREST_PERCENTAGES) {
    return DEFAULT_LOAN_INTEREST_PERCENTAGES[type as LoanType]
  }
  return 2.0
}
