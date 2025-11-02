/**
 * Business Rule Error
 *
 * Domain error thrown when a business rule is violated.
 * This error should be caught in the application/infrastructure layer
 * and mapped to appropriate HTTP status codes.
 */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessRuleError);
    }
  }
}
