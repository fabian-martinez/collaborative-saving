/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MemberRole } from '@domain/enums/member-role.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetAuditLogsQueryHandler } from '@application/queries/audit/get-audit-logs.query-handler';
import { GetAuditLogsQueryHttpDto } from '../dto/audit/get-audit-logs-query-http.dto';
import { AuditLogResponseHttpDto } from '../dto/audit/audit-log-response-http.dto';
import { PaginatedResponseHttpDto } from '../dto/paginated-response-http.dto';

@ApiTags('Audit V2')
@Controller('v2/audit-logs')
export class AuditV2Controller {
  constructor(private readonly getAuditLogsQuery: GetAuditLogsQueryHandler) {}

  @Get()
  @Roles(MemberRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List audit logs with pagination and filters',
    description:
      'Retrieves immutable audit log entries ordered by most recent first. Restricted to admin users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: PaginatedResponseHttpDto<AuditLogResponseHttpDto>,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getAuditLogs(
    @Query() query: GetAuditLogsQueryHttpDto,
  ): Promise<PaginatedResponseHttpDto<AuditLogResponseHttpDto>> {
    const result = await this.getAuditLogsQuery.execute({
      eventType: query.event_type,
      entityType: query.entity_type,
      entityId: query.entity_id,
      meetingId: query.meeting_id,
      page: query.page,
      limit: query.limit,
    });

    return {
      data: result.data.map((log) => ({
        id: log.id,
        event_type: log.eventType,
        entity_type: log.entityType,
        entity_id: log.entityId,
        meeting_id: log.meetingId,
        user_id: log.userId,
        user_email: log.userEmail,
        user_role: log.userRole,
        reason: log.reason,
        details: log.details,
        created_at: log.createdAt,
      })),
      pagination: result.pagination,
    };
  }
}
