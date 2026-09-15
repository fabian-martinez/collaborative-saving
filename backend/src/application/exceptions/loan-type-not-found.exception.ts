/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * LoanType Not Found Exception
 *
 * Application-level exception for when a loan type is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class LoanTypeNotFoundException extends NotFoundError {
  constructor(loanTypeId: string) {
    super('LoanType', loanTypeId);
    this.name = 'LoanTypeNotFoundException';
  }
}
