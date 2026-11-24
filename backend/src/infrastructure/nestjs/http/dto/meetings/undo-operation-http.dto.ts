/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UndoOperationHttpDto {
  @ApiPropertyOptional({
    description: 'Reason for undoing the Step 1 operation',
    maxLength: 500,
    example: 'Cobro registrado al socio equivocado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
