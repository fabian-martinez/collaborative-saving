/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuditLog as AuditLogDomain } from '@domain/entities/audit-log.entity';
import { AuditLog as AuditLogEntity } from '../entities/audit-log.entity';

export class AuditLogMapper {
  static toDomain(persistence: AuditLogEntity): AuditLogDomain {
    try {
      return AuditLogDomain.fromPersistence({
        id: persistence.id,
        eventType: persistence.eventType,
        entityType: persistence.entityType,
        entityId: persistence.entityId,
        meetingId: persistence.meetingId ?? null,
        userId: persistence.userId ?? null,
        userEmail: persistence.userEmail ?? null,
        userRole: persistence.userRole ?? null,
        reason: persistence.reason ?? null,
        details: persistence.details ?? {},
        createdAt: persistence.createdAt,
      });
    } catch (error) {
      throw new Error(
        `Failed to map AuditLog to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: AuditLogDomain): Partial<AuditLogEntity> {
    return {
      id: domain.id,
      eventType: domain.eventType,
      entityType: domain.entityType,
      entityId: domain.entityId,
      meetingId: domain.meetingId,
      userId: domain.userId,
      userEmail: domain.userEmail,
      userRole: domain.userRole,
      reason: domain.reason,
      details: domain.details,
      createdAt: domain.createdAt,
    };
  }
}
