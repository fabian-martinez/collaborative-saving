import { PaymentType } from '../enums/payment-type.enum';

/**
 * Novelty Description Parser
 *
 * Utility functions for parsing structured metadata from novelty descriptions.
 * Novelties include a prefix [AFFECTED:tipo] in their description to allow
 * querying by affected payment type without modifying the database schema.
 */

/**
 * Extracts the affected payment type from a novelty description.
 *
 * @param description - The description string that may contain [AFFECTED:tipo] prefix
 * @returns The PaymentType if found, null otherwise
 *
 * @example
 * parseAffectedPaymentType("[AFFECTED:fee]Novedad en Multa/otro pago: 50.00")
 * // Returns: PaymentType.FEE
 */
export function parseAffectedPaymentType(
  description: string | null | undefined,
): PaymentType | null {
  if (!description) {
    return null;
  }

  const match = description.match(/^\[AFFECTED:(\w+)\]/);
  if (!match) {
    return null;
  }

  const affectedType = match[1];
  // Validate that it's a valid PaymentType
  if (Object.values(PaymentType).includes(affectedType as PaymentType)) {
    return affectedType as PaymentType;
  }

  return null;
}

/**
 * Removes the [AFFECTED:tipo] prefix from a description, returning only the human-readable part.
 *
 * @param description - The description string that may contain [AFFECTED:tipo] prefix
 * @returns The description without the prefix
 *
 * @example
 * removeAffectedPrefix("[AFFECTED:fee]Novedad en Multa/otro pago: 50.00")
 * // Returns: "Novedad en Multa/otro pago: 50.00"
 */
export function removeAffectedPrefix(
  description: string | null | undefined,
): string {
  if (!description) {
    return '';
  }

  return description.replace(/^\[AFFECTED:\w+\]/, '');
}

/**
 * Checks if a description contains the AFFECTED prefix.
 *
 * @param description - The description string to check
 * @returns true if the description contains the prefix, false otherwise
 */
export function hasAffectedPrefix(
  description: string | null | undefined,
): boolean {
  if (!description) {
    return false;
  }

  return /^\[AFFECTED:\w+\]/.test(description);
}

