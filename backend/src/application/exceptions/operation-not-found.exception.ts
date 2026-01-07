import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * Operation Not Found Exception
 *
 * Application-level exception for when an operation is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class OperationNotFoundException extends NotFoundError {
  constructor(operationId: string) {
    super('Operation', operationId);
    this.name = 'OperationNotFoundException';
  }
}
