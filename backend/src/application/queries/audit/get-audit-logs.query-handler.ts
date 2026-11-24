/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuditLogRepository } from '@domain/ports/repositories/audit-log-repository.port';
import { GetAuditLogsQueryDto } from '../../dto/audit/get-audit-logs-query.dto';
import { PaginatedAuditLogsResponseDto } from '../../dto/audit/audit-log-response.dto';

export class GetAuditLogsQueryHandler {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(
    query: GetAuditLogsQueryDto,
  ): Promise<PaginatedAuditLogsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.auditLogRepository.findWithPagination(
      {
        eventType: query.eventType,
        entityType: query.entityType,
        entityId: query.entityId,
        meetingId: query.meetingId,
      },
      { page, limit },
    );

    return {
      data: result.data.map((log) => ({
        id: log.id,
        eventType: log.eventType,
        entityType: log.entityType,
        entityId: log.entityId,
        meetingId: log.meetingId,
        userId: log.userId,
        userEmail: log.userEmail,
        userRole: log.userRole,
        reason: log.reason,
        details: log.details,
        createdAt: log.createdAt,
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}
