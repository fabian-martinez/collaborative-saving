/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditLogFilters,
  AuditLogPaginationOptions,
  AuditLogRepository,
  PaginatedAuditLogs,
} from '@domain/ports/repositories/audit-log-repository.port';
import { AuditLog as AuditLogDomain } from '@domain/entities/audit-log.entity';
import { AuditLog as AuditLogEntity } from '../entities/audit-log.entity';
import { AuditLogMapper } from '../mappers/audit-log.mapper';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

@Injectable()
export class TypeOrmAuditLogRepository implements AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  private getRepository(): Repository<AuditLogEntity> {
    const activeQueryRunner = this.transactionManager.getActiveQueryRunner();
    if (activeQueryRunner) {
      return activeQueryRunner.manager.getRepository(
        AuditLogEntity,
      ) as Repository<AuditLogEntity>;
    }
    return this.repo;
  }

  async save(auditLog: AuditLogDomain): Promise<AuditLogDomain> {
    const repo = this.getRepository();
    const persistence = AuditLogMapper.toPersistence(auditLog);
    const saved = await repo.save(persistence as AuditLogEntity);
    return AuditLogMapper.toDomain(saved);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => AuditLogMapper.toDomain(entity));
  }

  async findByMeeting(meetingId: string): Promise<AuditLogDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { meetingId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => AuditLogMapper.toDomain(entity));
  }

  async findWithPagination(
    filters?: AuditLogFilters,
    pagination?: AuditLogPaginationOptions,
  ): Promise<PaginatedAuditLogs> {
    const repo = this.getRepository();
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination?.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = repo.createQueryBuilder('audit_log');

    if (filters?.eventType) {
      qb.andWhere('audit_log.event_type = :eventType', {
        eventType: filters.eventType,
      });
    }

    if (filters?.entityType) {
      qb.andWhere('audit_log.entity_type = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters?.entityId) {
      qb.andWhere('audit_log.entity_id = :entityId', {
        entityId: filters.entityId,
      });
    }

    if (filters?.meetingId) {
      qb.andWhere('audit_log.meeting_id = :meetingId', {
        meetingId: filters.meetingId,
      });
    }

    qb.orderBy('audit_log.created_at', 'DESC').skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: entities.map((entity) => AuditLogMapper.toDomain(entity)),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
