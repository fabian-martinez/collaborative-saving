/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { TypeOrmAuditLogRepository } from './typeorm-audit-log.repository';
import { AuditLog as AuditLogEntity } from '../entities/audit-log.entity';
import { AuditLog as AuditLogDomain } from '@domain/entities/audit-log.entity';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

describe('TypeOrmAuditLogRepository', () => {
  let repository: TypeOrmAuditLogRepository;
  let typeOrmRepo: jest.Mocked<Repository<AuditLogEntity>>;
  let transactionManager: jest.Mocked<TransactionManager>;

  const createPersistenceEntity = (
    overrides: Partial<AuditLogEntity> = {},
  ): AuditLogEntity => {
    const entity = new AuditLogEntity();
    entity.id = overrides.id ?? 'audit-1';
    entity.eventType = overrides.eventType ?? AuditEventType.OPERATION_DELETED;
    entity.entityType = overrides.entityType ?? 'operation';
    entity.entityId = overrides.entityId ?? 'op-1';
    entity.meetingId = overrides.meetingId ?? 'meet-1';
    entity.userId = overrides.userId ?? 'user-1';
    entity.userEmail = overrides.userEmail ?? 'admin@example.com';
    entity.userRole = overrides.userRole ?? 'admin';
    entity.reason = overrides.reason ?? 'Cobro erróneo';
    entity.details = overrides.details ?? { amount: 10000 };
    entity.createdAt = overrides.createdAt ?? new Date('2026-11-24T16:00:00Z');
    return entity;
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockTransactionManager: jest.Mocked<TransactionManager> = {
      execute: jest.fn(),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmAuditLogRepository,
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmAuditLogRepository>(
      TypeOrmAuditLogRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(AuditLogEntity));
    transactionManager = module.get(TRANSACTION_MANAGER);
  });

  describe('save', () => {
    it('should save an AuditLog using default repository when no transaction is active', async () => {
      // ARRANGE
      const domain = AuditLogDomain.create({
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: 'op-1',
        meetingId: 'meet-1',
        userId: 'user-1',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        reason: 'Cobro erróneo',
        details: { amount: 10000 },
      });
      const savedEntity = createPersistenceEntity({ id: domain.id });
      const saveSpy = jest
        .spyOn(typeOrmRepo, 'save')
        .mockResolvedValue(savedEntity);

      // ACT
      const result = await repository.save(domain);

      // ASSERT
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(AuditLogDomain);
      expect(result.id).toBe(domain.id);
      expect(result.eventType).toBe(AuditEventType.OPERATION_DELETED);
    });

    it('should use active QueryRunner repository when inside a transaction', async () => {
      // ARRANGE
      const domain = AuditLogDomain.create({
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: 'op-1',
      });
      const savedEntity = createPersistenceEntity({ id: domain.id });
      const txRepo = {
        save: jest.fn().mockResolvedValue(savedEntity),
      };
      const mockQueryRunner = {
        manager: {
          getRepository: jest.fn().mockReturnValue(txRepo),
        },
      } as unknown as QueryRunner;

      jest
        .spyOn(transactionManager, 'getActiveQueryRunner')
        .mockReturnValue(mockQueryRunner);

      const defaultSaveSpy = jest.spyOn(typeOrmRepo, 'save');

      // ACT
      const result = await repository.save(domain);

      // ASSERT
      expect(txRepo.save).toHaveBeenCalledTimes(1);
      expect(defaultSaveSpy).not.toHaveBeenCalled();
      expect(result.id).toBe(domain.id);
    });
  });

  describe('findByEntity', () => {
    it('should return mapped domain AuditLogs ordered by createdAt DESC', async () => {
      // ARRANGE
      const entities = [createPersistenceEntity()];
      const findSpy = jest
        .spyOn(typeOrmRepo, 'find')
        .mockResolvedValue(entities);

      // ACT
      const results = await repository.findByEntity('operation', 'op-1');

      // ASSERT
      expect(findSpy).toHaveBeenCalledWith({
        where: { entityType: 'operation', entityId: 'op-1' },
        order: { createdAt: 'DESC' },
      });
      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(AuditLogDomain);
    });
  });

  describe('findByMeeting', () => {
    it('should return mapped domain AuditLogs for a meeting ordered by createdAt DESC', async () => {
      // ARRANGE
      const entities = [createPersistenceEntity()];
      const findSpy = jest
        .spyOn(typeOrmRepo, 'find')
        .mockResolvedValue(entities);

      // ACT
      const results = await repository.findByMeeting('meet-1');

      // ASSERT
      expect(findSpy).toHaveBeenCalledWith({
        where: { meetingId: 'meet-1' },
        order: { createdAt: 'DESC' },
      });
      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(AuditLogDomain);
    });
  });

  describe('findWithPagination', () => {
    it('should apply filters and return paginated AuditLogs', async () => {
      // ARRANGE
      const entities = [createPersistenceEntity()];
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([entities, 1]),
      };
      const createQbSpy = jest
        .spyOn(typeOrmRepo, 'createQueryBuilder')
        .mockReturnValue(qb as never);

      // ACT
      const result = await repository.findWithPagination(
        {
          eventType: AuditEventType.OPERATION_DELETED,
          entityType: 'operation',
          meetingId: 'meet-1',
        },
        { page: 1, limit: 20 },
      );

      // ASSERT
      expect(createQbSpy).toHaveBeenCalledWith('audit_log');
      expect(qb.andWhere).toHaveBeenCalledTimes(3);
      expect(qb.orderBy).toHaveBeenCalledWith('audit_log.created_at', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });
});
