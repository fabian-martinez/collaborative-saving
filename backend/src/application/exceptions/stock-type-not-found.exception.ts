/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * StockType Not Found Exception
 *
 * Application-level exception for when a stock type is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class StockTypeNotFoundException extends NotFoundError {
  constructor(stockTypeId: string) {
    super('StockType', stockTypeId);
    this.name = 'StockTypeNotFoundException';
  }
}
