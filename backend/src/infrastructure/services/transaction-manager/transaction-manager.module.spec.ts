/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AUDIT_LOG_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@domain/constants/injection-tokens';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { AuditLog } from '@infrastructure/typeorm/entities/audit-log.entity';
import { TypeOrmAuditLogRepository } from '@infrastructure/typeorm/repositories/typeorm-audit-log.repository';
import { TransactionManagerModule } from './transaction-manager.module';

@Global()
@Module({
  providers: [{ provide: DataSource, useValue: {} }],
  exports: [DataSource],
})
class MockDataSourceModule {}

describe('TransactionManagerModule DI', () => {
  it('should provide TRANSACTION_MANAGER as the same singleton as TransactionManager and resolve TypeOrmAuditLogRepository', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MockDataSourceModule, TransactionManagerModule],
      providers: [
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {},
        },
        {
          provide: AUDIT_LOG_REPOSITORY,
          useClass: TypeOrmAuditLogRepository,
        },
      ],
    }).compile();

    const tmClass = moduleRef.get(TransactionManager);
    const tmSymbol = moduleRef.get<TransactionManager>(TRANSACTION_MANAGER);
    const auditRepo =
      moduleRef.get<TypeOrmAuditLogRepository>(AUDIT_LOG_REPOSITORY);

    expect(tmSymbol).toBe(tmClass);
    expect(auditRepo).toBeInstanceOf(TypeOrmAuditLogRepository);
  });
});
