/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuditEventType } from '@domain/enums/audit-event-type.enum';

export interface GetAuditLogsQueryDto {
  eventType?: AuditEventType;
  entityType?: string;
  entityId?: string;
  meetingId?: string;
  page?: number;
  limit?: number;
}
