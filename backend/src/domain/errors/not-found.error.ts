/**
 * Not Found Error
 *
 * Domain error thrown when a resource is not found.
 * This error should be caught in the application/infrastructure layer
 * and mapped to appropriate HTTP status codes (404).
 */
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'NotFoundError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}
