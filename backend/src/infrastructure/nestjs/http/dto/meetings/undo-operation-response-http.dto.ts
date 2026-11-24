/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';

export class UndoOperationResponseHttpDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  operation_id: string;

  @ApiProperty({ example: 'Operación anulada exitosamente' })
  message: string;
}
