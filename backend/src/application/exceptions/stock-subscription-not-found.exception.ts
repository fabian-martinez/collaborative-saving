import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * Stock Subscription Not Found Exception
 *
 * Application-level exception for when a stock subscription is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class StockSubscriptionNotFoundException extends NotFoundError {
  constructor(subscriptionId: string) {
    super('StockSubscription', subscriptionId);
    this.name = 'StockSubscriptionNotFoundException';
  }
}
