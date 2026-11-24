/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';

export class GetAuditLogsQueryHttpDto {
  @ApiPropertyOptional({
    description: 'Filter by audit event type',
    enum: AuditEventType,
    example: AuditEventType.OPERATION_DELETED,
  })
  @IsOptional()
  @IsEnum(AuditEventType)
  event_type?: AuditEventType;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    example: 'operation',
  })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by meeting UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;

  @ApiPropertyOptional({
    description: 'Page number (starts at 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page (1-100)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
