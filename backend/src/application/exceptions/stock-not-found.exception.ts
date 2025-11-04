import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * Stock Not Found Exception
 *
 * Application-level exception for when a stock is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class StockNotFoundException extends NotFoundError {
  constructor(stockId: string) {
    super('Stock', stockId);
    this.name = 'StockNotFoundException';
  }
}
