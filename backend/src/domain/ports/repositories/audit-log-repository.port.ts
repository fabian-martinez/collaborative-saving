/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuditLog } from '../../entities/audit-log.entity';
import { AuditEventType } from '../../enums/audit-event-type.enum';

export interface AuditLogFilters {
  eventType?: AuditEventType;
  entityType?: string;
  entityId?: string;
  meetingId?: string;
}

export interface AuditLogPaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Port for persisting and querying immutable audit log entries.
 */
export interface AuditLogRepository {
  save(auditLog: AuditLog): Promise<AuditLog>;
  findByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  findByMeeting(meetingId: string): Promise<AuditLog[]>;
  findWithPagination(
    filters?: AuditLogFilters,
    pagination?: AuditLogPaginationOptions,
  ): Promise<PaginatedAuditLogs>;
}
