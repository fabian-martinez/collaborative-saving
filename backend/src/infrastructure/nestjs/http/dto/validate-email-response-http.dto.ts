/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';

export class ValidateEmailResponseHttpDto {
  @ApiProperty({
    description: 'Indica si el socio existe registrado en la base de datos',
    example: true,
  })
  exists: boolean;

  @ApiProperty({
    description: 'Indica si el socio está actualmente en estado activo',
    example: true,
  })
  active: boolean;
}
