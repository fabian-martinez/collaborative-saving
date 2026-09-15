/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';

export class LoanTypeResponseHttpDto {
  @ApiProperty({
    description: 'Unique identifier of the loan type',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  id: string;

  @ApiProperty({
    description: 'Unique code/slug of the loan type',
    example: 'corriente',
  })
  code: string;

  @ApiProperty({
    description: 'Display name of the loan type',
    example: 'Préstamo Corriente',
  })
  name: string;

  @ApiProperty({
    description: 'Default interest rate as decimal (e.g., 0.015 for 1.5%)',
    example: 0.015,
  })
  interest_rate: number;

  @ApiProperty({
    description: 'Description of the loan type',
    example: 'Préstamo corriente estándar',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}
