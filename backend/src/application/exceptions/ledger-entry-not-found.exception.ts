import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * Ledger Entry Not Found Exception
 *
 * Application-level exception for when a ledger entry is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class LedgerEntryNotFoundException extends NotFoundError {
  constructor(ledgerEntryId: string) {
    super('LedgerEntry', ledgerEntryId);
    this.name = 'LedgerEntryNotFoundException';
  }
}
