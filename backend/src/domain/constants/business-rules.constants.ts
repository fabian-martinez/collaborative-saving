/**
 * Business Rules Constants
 *
 * Centralized constants for domain business logic.
 * These constants represent business rules and configuration values used throughout the domain.
 */

/**
 * Loan-related constants
 */
export const LOAN_CONSTANTS = {
  DEFAULT_TERM_MONTHS: 24,
  MAX_TERM_MONTHS: 80, // Used when monthly payment is 0
  MIN_TERM_MONTHS: 1,
  DEFAULT_INTEREST_RATE_CURRENT: 0.015,
  DEFAULT_INTEREST_RATE_ACTION: 0.015,
  DEFAULT_INTEREST_RATE_AGIL: 0.02,
  DEFAULT_INTEREST_RATE_PRIORITARIO: 0.02,
  PAYOFF_TOLERANCE_COP: 1.0, // Tolerancia para absorción automática de saldos residuales por redondeo
} as const;

/**
 * Calculation precision constants
 */
export const CALCULATION_CONSTANTS = {
  FLOATING_POINT_PRECISION: 1e10,
  FLOATING_POINT_EPSILON: 0.0001,
  DECIMAL_PRECISION: 100, // For rounding to 2 decimals (100 = 10^2)
} as const;

/**
 * Pagination constants
 */
export const PAGINATION_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
