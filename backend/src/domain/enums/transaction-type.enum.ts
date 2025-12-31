/**
 * Transaction Type Enum
 *
 * Types of loan transactions (disbursements, principal payments, interest payments).
 * This enum represents the different transaction types for loans in the domain.
 */
export enum TransactionType {
  DISBURSEMENT = 'disbursement',
  PRINCIPAL_PAYMENT = 'principal_payment',
  INTEREST_PAYMENT = 'interest_payment',
}
