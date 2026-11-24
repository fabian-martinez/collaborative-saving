/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';

export class AuditLogResponseHttpDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({
    enum: AuditEventType,
    example: AuditEventType.OPERATION_DELETED,
  })
  event_type: AuditEventType;

  @ApiProperty({ example: 'operation' })
  entity_type: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  entity_id: string;

  @ApiPropertyOptional({ nullable: true })
  meeting_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  user_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  user_email: string | null;

  @ApiPropertyOptional({ nullable: true })
  user_role: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason: string | null;

  @ApiProperty({ type: Object })
  details: Record<string, unknown>;

  @ApiProperty({ type: Date })
  created_at: Date;
}
