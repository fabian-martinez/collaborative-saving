/**
 * Invalid Request Error
 *
 * Domain error thrown when a request is invalid (e.g., validation fails, business rules violated).
 * This error should be caught in the application/infrastructure layer
 * and mapped to appropriate HTTP status codes (400).
 */
export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRequestError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidRequestError);
    }
  }
}
