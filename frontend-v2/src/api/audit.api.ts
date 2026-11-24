/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';

export type AuditEventType =
  | 'OPERATION_DELETED'
  | 'REVALUATION_UNDONE'
  | 'MEETING_CLOSED'
  | 'LOAN_UPDATED';

export interface AuditLogItem {
  id: string;
  event_type: AuditEventType;
  entity_type: string;
  entity_id: string;
  meeting_id: string | null;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  reason: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface GetAuditLogsParams {
  event_type?: AuditEventType;
  entity_type?: string;
  entity_id?: string;
  meeting_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditApi = {
  async getAuditLogs(
    params?: GetAuditLogsParams,
  ): Promise<PaginatedAuditLogsResponse> {
    const cleanParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    );
    const response = await apiClient.get<PaginatedAuditLogsResponse>(
      '/v2/audit-logs',
      { params: cleanParams },
    );
    return response.data;
  },
};
