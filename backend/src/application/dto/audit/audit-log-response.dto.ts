/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuditEventType } from '@domain/enums/audit-event-type.enum';

export interface AuditLogResponseDto {
  id: string;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  meetingId: string | null;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  reason: string | null;
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface PaginatedAuditLogsResponseDto {
  data: AuditLogResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
