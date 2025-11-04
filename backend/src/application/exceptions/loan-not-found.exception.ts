import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * Loan Not Found Exception
 *
 * Application-level exception for when a loan is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class LoanNotFoundException extends NotFoundError {
  constructor(loanId: string) {
    super('Loan', loanId);
    this.name = 'LoanNotFoundException';
  }
}
