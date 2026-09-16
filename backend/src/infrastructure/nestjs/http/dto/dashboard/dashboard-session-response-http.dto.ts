/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';

export class DashboardSessionResponseHttpDto {
  @ApiProperty({
    description: 'Estado de la validación de sesión para el dashboard',
    example: 'ok',
  })
  status: string;
}
