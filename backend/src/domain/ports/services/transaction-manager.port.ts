/**
 * Transaction Manager Port
 *
 * Defines the contract for transaction management in the domain layer.
 * The implementation should handle database transactions atomically.
 */
export interface TransactionContext {
  /**
   * Execute an operation within this transaction context.
   * Can be used for nested operations if supported by implementation.
   */
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

export abstract class TransactionManager {
  /**
   * Execute an operation within a transaction.
   * If the operation succeeds, commits the transaction.
   * If the operation fails, rolls back the transaction.
   *
   * @param operation - The operation to execute within the transaction
   * @returns The result of the operation
   * @throws Any error thrown by the operation, after rolling back the transaction
   */
  abstract execute<T>(
    operation: (context: TransactionContext) => Promise<T>,
  ): Promise<T>;
}
