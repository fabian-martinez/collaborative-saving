/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuditLogMapper } from './audit-log.mapper';
import { AuditLog as AuditLogDomain } from '@domain/entities/audit-log.entity';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';
import { AuditLog as AuditLogEntity } from '../entities/audit-log.entity';

describe('AuditLogMapper', () => {
  describe('toDomain', () => {
    it('should map TypeORM entity to domain AuditLog', () => {
      // ARRANGE
      const entity = new AuditLogEntity();
      entity.id = 'audit-1';
      entity.eventType = 'OPERATION_DELETED';
      entity.entityType = 'operation';
      entity.entityId = 'op-1';
      entity.meetingId = 'meet-1';
      entity.userId = 'user-1';
      entity.userEmail = 'admin@example.com';
      entity.userRole = 'admin';
      entity.reason = 'Duplicado';
      entity.details = { operation: { id: 'op-1' } };
      entity.createdAt = new Date('2026-11-24T16:00:00.000Z');

      // ACT
      const domain = AuditLogMapper.toDomain(entity);

      // ASSERT
      expect(domain).toBeInstanceOf(AuditLogDomain);
      expect(domain.id).toBe('audit-1');
      expect(domain.eventType).toBe(AuditEventType.OPERATION_DELETED);
      expect(domain.entityType).toBe('operation');
      expect(domain.entityId).toBe('op-1');
      expect(domain.meetingId).toBe('meet-1');
      expect(domain.userId).toBe('user-1');
      expect(domain.userEmail).toBe('admin@example.com');
      expect(domain.userRole).toBe('admin');
      expect(domain.reason).toBe('Duplicado');
      expect(domain.details).toEqual({ operation: { id: 'op-1' } });
    });

    it('should throw wrapped error when eventType is invalid', () => {
      // ARRANGE
      const entity = new AuditLogEntity();
      entity.id = 'audit-1';
      entity.eventType = 'INVALID';
      entity.entityType = 'operation';
      entity.entityId = 'op-1';
      entity.createdAt = new Date();

      // ACT & ASSERT
      expect(() => AuditLogMapper.toDomain(entity)).toThrow(
        'Failed to map AuditLog to domain: Invalid audit event type: INVALID',
      );
    });
  });

  describe('toPersistence', () => {
    it('should map domain AuditLog to persistence object', () => {
      // ARRANGE
      const createdAt = new Date('2026-11-24T16:00:00.000Z');
      const domain = AuditLogDomain.fromPersistence({
        id: 'audit-1',
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: 'op-1',
        meetingId: 'meet-1',
        userId: 'user-1',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        reason: 'Corrección',
        details: { test: true },
        createdAt,
      });

      // ACT
      const persistence = AuditLogMapper.toPersistence(domain);

      // ASSERT
      expect(persistence).toEqual({
        id: 'audit-1',
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: 'op-1',
        meetingId: 'meet-1',
        userId: 'user-1',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        reason: 'Corrección',
        details: { test: true },
        createdAt,
      });
    });
  });
});
