import { LedgerEntry } from '../entities/ledger-entry.entity';
import { BusinessRuleError } from '../errors/business-rule.error';

/**
 * Operation Balance Validator
 *
 * Domain service that validates that a double-entry accounting operation
 * is balanced (total debits = total credits).
 *
 * Rules:
 * - At least 2 ledger entries are required
 * - Sum of debits (amount > 0) must equal sum of credits (amount < 0)
 */
export class OperationBalanceValidator {
  /**
   * Validates that ledger entries are balanced.
   *
   * @param entries - Array of ledger entries to validate
   * @throws BusinessRuleError if validation fails
   */
  validateBalance(entries: LedgerEntry[]): void {
    if (entries.length < 2) {
      throw new BusinessRuleError(
        `Operation must have at least 2 ledger entries, got ${entries.length}`,
      );
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      const amount = entry.amount;
      if (amount > 0) {
        totalDebits += amount;
      } else if (amount < 0) {
        totalCredits += Math.abs(amount);
      } else {
        throw new BusinessRuleError('Ledger entry amount cannot be zero');
      }
    }

    // Round to 2 decimal places to avoid floating point precision issues
    const roundedDebits = Math.round(totalDebits * 100) / 100;
    const roundedCredits = Math.round(totalCredits * 100) / 100;

    if (roundedDebits !== roundedCredits) {
      throw new BusinessRuleError(
        `Operation is not balanced: debits = ${roundedDebits}, credits = ${roundedCredits}`,
      );
    }
  }
}
