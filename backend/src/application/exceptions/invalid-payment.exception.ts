import { InvalidRequestError } from '@domain/errors/invalid-request.error';

/**
 * Invalid Payment Exception
 *
 * Application-level exception for when a payment is invalid.
 * Extends InvalidRequestError for consistency with domain errors.
 */
export class InvalidPaymentException extends InvalidRequestError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaymentException';
  }
}
