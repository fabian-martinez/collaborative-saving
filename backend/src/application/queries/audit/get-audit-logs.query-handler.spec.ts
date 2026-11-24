/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetAuditLogsQueryHandler } from './get-audit-logs.query-handler';
import { AuditLogRepository } from '@domain/ports/repositories/audit-log-repository.port';
import { AuditLog } from '@domain/entities/audit-log.entity';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';

describe('GetAuditLogsQueryHandler', () => {
  let handler: GetAuditLogsQueryHandler;
  let auditLogRepository: jest.Mocked<AuditLogRepository>;

  beforeEach(() => {
    auditLogRepository = {
      save: jest.fn(),
      findByEntity: jest.fn(),
      findByMeeting: jest.fn(),
      findWithPagination: jest.fn(),
    };
    handler = new GetAuditLogsQueryHandler(auditLogRepository);
  });

  it('should return paginated audit logs with default pagination', async () => {
    // ARRANGE
    const log = AuditLog.fromPersistence({
      id: 'audit-1',
      eventType: AuditEventType.OPERATION_DELETED,
      entityType: 'operation',
      entityId: 'op-1',
      meetingId: 'meet-1',
      userId: 'user-1',
      userEmail: 'admin@example.com',
      userRole: 'admin',
      reason: 'Error de registro',
      details: { amount: 25000 },
      createdAt: new Date('2026-11-24T16:00:00Z'),
    });

    const findSpy = jest
      .spyOn(auditLogRepository, 'findWithPagination')
      .mockResolvedValue({
        data: [log],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

    // ACT
    const result = await handler.execute({});

    // ASSERT
    expect(findSpy).toHaveBeenCalledWith(
      {
        eventType: undefined,
        entityType: undefined,
        entityId: undefined,
        meetingId: undefined,
      },
      { page: 1, limit: 20 },
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('audit-1');
    expect(result.data[0].eventType).toBe(AuditEventType.OPERATION_DELETED);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('should forward filters and custom pagination options', async () => {
    // ARRANGE
    const findSpy = jest
      .spyOn(auditLogRepository, 'findWithPagination')
      .mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      });

    // ACT
    const result = await handler.execute({
      eventType: AuditEventType.OPERATION_DELETED,
      entityType: 'operation',
      entityId: 'op-1',
      meetingId: 'meet-1',
      page: 2,
      limit: 10,
    });

    // ASSERT
    expect(findSpy).toHaveBeenCalledWith(
      {
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: 'op-1',
        meetingId: 'meet-1',
      },
      { page: 2, limit: 10 },
    );
    expect(result.data).toEqual([]);
  });
});
