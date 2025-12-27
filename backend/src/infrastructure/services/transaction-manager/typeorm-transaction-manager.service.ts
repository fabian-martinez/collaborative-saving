import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner as TypeOrmQueryRunner } from 'typeorm';
import { AsyncLocalStorage } from 'async_hooks';
import {
  TransactionManager,
  TransactionContext,
  QueryRunner,
} from '@domain/ports/services/transaction-manager.port';

/**
 * Transaction context stored in AsyncLocalStorage
 */
interface TransactionContextData {
  queryRunner: TypeOrmQueryRunner;
  depth: number;
}

/**
 * TypeORM Transaction Manager Implementation
 *
 * Implements the TransactionManager port using TypeORM's QueryRunner.
 * Provides transactional execution of operations with automatic commit/rollback.
 * Supports nested transactions by reusing the active transaction when available.
 */
@Injectable()
export class TypeOrmTransactionManager implements TransactionManager {
  private readonly transactionStorage =
    new AsyncLocalStorage<TransactionContextData>();

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get the active QueryRunner if there's an active transaction
   */
  getActiveQueryRunner(): QueryRunner | null {
    const context = this.transactionStorage.getStore();
    return (context?.queryRunner as QueryRunner) || null;
  }

  async execute<T>(
    operation: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    // Check if there's already an active transaction
    const existingContext = this.transactionStorage.getStore();

    if (existingContext) {
      // Nested transaction: reuse existing QueryRunner
      const context: TransactionContext = {
        execute: async <U>(nestedOperation: () => Promise<U>): Promise<U> => {
          return nestedOperation();
        },
      };

      // Increment depth counter
      const newContext: TransactionContextData = {
        queryRunner: existingContext.queryRunner,
        depth: existingContext.depth + 1,
      };

      return this.transactionStorage.run(newContext, async () => {
        return await operation(context);
      });
    }

    // Top-level transaction: create new QueryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const contextData: TransactionContextData = {
      queryRunner,
      depth: 1,
    };

    try {
      const context: TransactionContext = {
        execute: async <U>(nestedOperation: () => Promise<U>): Promise<U> => {
          return nestedOperation();
        },
      };

      const result = await this.transactionStorage.run(
        contextData,
        async () => {
          return await operation(context);
        },
      );

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
