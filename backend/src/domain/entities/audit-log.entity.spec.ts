/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuditLog } from './audit-log.entity';
import { AuditEventType } from '../enums/audit-event-type.enum';

describe('AuditLog', () => {
  describe('create', () => {
    it('should create an AuditLog with generated UUID and default values', () => {
      // ACT
      const log = AuditLog.create({
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: 'op-123',
        meetingId: 'meet-123',
        userId: 'user-123',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        reason: 'Cobro duplicado',
        details: { amount: 50000 },
      });

      // ASSERT
      expect(log.id).toBeDefined();
      expect(log.eventType).toBe(AuditEventType.OPERATION_DELETED);
      expect(log.entityType).toBe('operation');
      expect(log.entityId).toBe('op-123');
      expect(log.meetingId).toBe('meet-123');
      expect(log.userId).toBe('user-123');
      expect(log.userEmail).toBe('admin@example.com');
      expect(log.userRole).toBe('admin');
      expect(log.reason).toBe('Cobro duplicado');
      expect(log.details).toEqual({ amount: 50000 });
      expect(log.createdAt).toBeInstanceOf(Date);
    });

    it('should default optional fields to null and details to empty object', () => {
      // ACT
      const log = AuditLog.create({
        eventType: AuditEventType.MEETING_CLOSED,
        entityType: 'meeting',
        entityId: 'meet-123',
      });

      // ASSERT
      expect(log.meetingId).toBeNull();
      expect(log.userId).toBeNull();
      expect(log.userEmail).toBeNull();
      expect(log.userRole).toBeNull();
      expect(log.reason).toBeNull();
      expect(log.details).toEqual({});
    });

    it('should return a shallow copy of details so internal state is protected', () => {
      // ARRANGE
      const log = AuditLog.create({
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: 'op-123',
        details: { key: 'value' },
      });

      // ACT
      const detailsCopy = log.details;
      detailsCopy.key = 'mutated';

      // ASSERT
      expect(log.details).toEqual({ key: 'value' });
    });

    it('should throw when entityType is empty', () => {
      // ACT & ASSERT
      expect(() =>
        AuditLog.create({
          eventType: AuditEventType.OPERATION_DELETED,
          entityType: '   ',
          entityId: 'op-123',
        }),
      ).toThrow('AuditLog entityType is required');
    });

    it('should throw when entityId is empty', () => {
      // ACT & ASSERT
      expect(() =>
        AuditLog.create({
          eventType: AuditEventType.OPERATION_DELETED,
          entityType: 'operation',
          entityId: '',
        }),
      ).toThrow('AuditLog entityId is required');
    });
  });

  describe('fromPersistence', () => {
    it('should hydrate AuditLog from persistence data', () => {
      // ARRANGE
      const createdAt = '2026-11-24T16:00:00.000Z';

      // ACT
      const log = AuditLog.fromPersistence({
        id: 'audit-1',
        eventType: 'OPERATION_DELETED',
        entityType: 'operation',
        entityId: 'op-1',
        meetingId: 'meet-1',
        userId: 'user-1',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        reason: 'Error en monto',
        details: { snapshot: true },
        createdAt,
      });

      // ASSERT
      expect(log.id).toBe('audit-1');
      expect(log.eventType).toBe(AuditEventType.OPERATION_DELETED);
      expect(log.createdAt).toEqual(new Date(createdAt));
      expect(log.details).toEqual({ snapshot: true });
    });

    it('should throw on invalid eventType', () => {
      // ACT & ASSERT
      expect(() =>
        AuditLog.fromPersistence({
          id: 'audit-1',
          eventType: 'UNKNOWN_EVENT',
          entityType: 'operation',
          entityId: 'op-1',
          createdAt: new Date(),
        }),
      ).toThrow('Invalid audit event type: UNKNOWN_EVENT');
    });
  });
});
