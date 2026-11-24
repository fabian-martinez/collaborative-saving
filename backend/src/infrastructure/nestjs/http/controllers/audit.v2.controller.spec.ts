/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditV2Controller } from './audit.v2.controller';
import { GetAuditLogsQueryHandler } from '@application/queries/audit/get-audit-logs.query-handler';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';

describe('AuditV2Controller', () => {
  let controller: AuditV2Controller;
  let queryHandler: jest.Mocked<GetAuditLogsQueryHandler>;

  beforeEach(async () => {
    const mockQueryHandler = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditV2Controller],
      providers: [
        {
          provide: GetAuditLogsQueryHandler,
          useValue: mockQueryHandler,
        },
      ],
    }).compile();

    controller = module.get<AuditV2Controller>(AuditV2Controller);
    queryHandler = module.get(GetAuditLogsQueryHandler);
  });

  describe('getAuditLogs', () => {
    it('should map snake_case query params to camelCase and return snake_case response', async () => {
      // ARRANGE
      const createdAt = new Date('2026-11-24T16:00:00Z');
      const executeSpy = jest.spyOn(queryHandler, 'execute').mockResolvedValue({
        data: [
          {
            id: 'audit-1',
            eventType: AuditEventType.OPERATION_DELETED,
            entityType: 'operation',
            entityId: 'op-1',
            meetingId: 'meet-1',
            userId: 'user-1',
            userEmail: 'admin@example.com',
            userRole: 'admin',
            reason: 'Cobro duplicado',
            details: { amount: 50000 },
            createdAt,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      // ACT
      const result = await controller.getAuditLogs({
        event_type: AuditEventType.OPERATION_DELETED,
        entity_type: 'operation',
        meeting_id: 'meet-1',
        page: 1,
        limit: 10,
      });

      // ASSERT
      expect(executeSpy).toHaveBeenCalledWith({
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: undefined,
        meetingId: 'meet-1',
        page: 1,
        limit: 10,
      });
      expect(result).toEqual({
        data: [
          {
            id: 'audit-1',
            event_type: AuditEventType.OPERATION_DELETED,
            entity_type: 'operation',
            entity_id: 'op-1',
            meeting_id: 'meet-1',
            user_id: 'user-1',
            user_email: 'admin@example.com',
            user_role: 'admin',
            reason: 'Cobro duplicado',
            details: { amount: 50000 },
            created_at: createdAt,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });
});
