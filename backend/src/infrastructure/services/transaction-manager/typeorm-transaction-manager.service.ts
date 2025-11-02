import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import {
  TransactionManager,
  TransactionContext,
} from '@domain/ports/services/transaction-manager.port';

/**
 * TypeORM Transaction Manager Implementation
 *
 * Implements the TransactionManager port using TypeORM's QueryRunner.
 * Provides transactional execution of operations with automatic commit/rollback.
 */
@Injectable()
export class TypeOrmTransactionManager implements TransactionManager {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(
    operation: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const context: TransactionContext = {
        execute: async <U>(nestedOperation: () => Promise<U>): Promise<U> => {
          // For nested operations, execute within the same transaction
          // This allows for nested use cases if needed
          return nestedOperation();
        },
      };

      const result = await operation(context);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get the QueryRunner for direct access (when needed by repositories).
   * This is a helper method for advanced use cases.
   *
   * Note: This method should generally not be used. Prefer using the
   * TransactionManager.execute() method which handles transactions automatically.
   */
  async withQueryRunner<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
