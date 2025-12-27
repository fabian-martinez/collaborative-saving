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

/**
 * QueryRunner interface for type safety
 * This allows repositories to access the active transaction's QueryRunner
 * when needed for TypeORM-specific operations.
 */
export interface QueryRunner {
  manager: {
    getRepository(entity: any): any;
    save<T>(entity: T): Promise<T>;
    update(entity: any, criteria: any, values: any): Promise<any>;
    findOne(entity: any, options: any): Promise<any>;
    find(entity: any, options: any): Promise<any[]>;
  };
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

  /**
   * Get the active QueryRunner if there's an active transaction.
   * Returns null if there's no active transaction.
   * This method allows repositories to participate in active transactions.
   *
   * @returns The active QueryRunner or null if no transaction is active
   */
  abstract getActiveQueryRunner(): QueryRunner | null;
}
