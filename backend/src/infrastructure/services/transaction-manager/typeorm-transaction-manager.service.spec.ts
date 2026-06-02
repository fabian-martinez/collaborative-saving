import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager.service';
import { TransactionContext } from '@domain/ports/services/transaction-manager.port';

describe('TypeOrmTransactionManager', () => {
  let service: TypeOrmTransactionManager;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let createQueryRunnerSpy: jest.SpyInstance;
  let connectSpy: jest.SpyInstance;
  let startTransactionSpy: jest.SpyInstance;
  let commitTransactionSpy: jest.SpyInstance;
  let rollbackTransactionSpy: jest.SpyInstance;
  let releaseSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock QueryRunner
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;

    // Mock DataSource
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmTransactionManager,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<TypeOrmTransactionManager>(TypeOrmTransactionManager);

    // Create spies to avoid 'this' scoping issues
    createQueryRunnerSpy = jest.spyOn(dataSource, 'createQueryRunner');
    connectSpy = jest.spyOn(queryRunner, 'connect');
    startTransactionSpy = jest.spyOn(queryRunner, 'startTransaction');
    commitTransactionSpy = jest.spyOn(queryRunner, 'commitTransaction');
    rollbackTransactionSpy = jest.spyOn(queryRunner, 'rollbackTransaction');
    releaseSpy = jest.spyOn(queryRunner, 'release');
  });

  describe('execute', () => {
    it('should execute operation within a transaction and commit on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await service.execute(operation);

      expect(result).toBe('success');
      expect(createQueryRunnerSpy).toHaveBeenCalledTimes(1);
      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(startTransactionSpy).toHaveBeenCalledTimes(1);
      expect(operation).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          execute: expect.any(Function),
        }),
      );
      expect(commitTransactionSpy).toHaveBeenCalledTimes(1);
      expect(rollbackTransactionSpy).not.toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalledTimes(1);
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(service.execute(operation)).rejects.toThrow(
        'Operation failed',
      );

      expect(startTransactionSpy).toHaveBeenCalledTimes(1);
      expect(commitTransactionSpy).not.toHaveBeenCalled();
      expect(rollbackTransactionSpy).toHaveBeenCalledTimes(1);
      expect(releaseSpy).toHaveBeenCalledTimes(1);
    });

    it('should provide TransactionContext with execute method', async () => {
      let receivedContext: TransactionContext | undefined;
      const operation = jest
        .fn()
        .mockImplementation(async (context: TransactionContext) => {
          receivedContext = context;
          return Promise.resolve('success');
        });

      await service.execute(operation);

      expect(receivedContext).toBeDefined();
      expect(receivedContext).toBeTruthy();
      if (receivedContext) {
        expect(typeof receivedContext.execute).toBe('function');
      }
    });

    it('should allow nested operations through context', async () => {
      const nestedOperation = jest.fn().mockResolvedValue('nested-result');
      const operation = jest
        .fn()
        .mockImplementation(async (context: TransactionContext) => {
          return await context.execute(nestedOperation);
        });

      const result = await service.execute(operation);

      expect(result).toBe('nested-result');
      expect(nestedOperation).toHaveBeenCalled();
    });

    it('should always release query runner even if commit fails', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      commitTransactionSpy.mockRejectedValue(new Error('Commit failed'));

      await expect(service.execute(operation)).rejects.toThrow('Commit failed');

      expect(rollbackTransactionSpy).toHaveBeenCalledTimes(1);
      expect(releaseSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('withQueryRunner', () => {
    it('should execute operation with QueryRunner and commit on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await service.withQueryRunner(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledWith(queryRunner);
      expect(createQueryRunnerSpy).toHaveBeenCalledTimes(1);
      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(startTransactionSpy).toHaveBeenCalledTimes(1);
      expect(commitTransactionSpy).toHaveBeenCalledTimes(1);
      expect(rollbackTransactionSpy).not.toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalledTimes(1);
    });

    it('should rollback on error', async () => {
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(service.withQueryRunner(operation)).rejects.toThrow(
        'Operation failed',
      );

      expect(startTransactionSpy).toHaveBeenCalledTimes(1);
      expect(rollbackTransactionSpy).toHaveBeenCalledTimes(1);
      expect(releaseSpy).toHaveBeenCalledTimes(1);
    });
  });
});
