/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

export class StockTypeResponseHttpDto {
  @ApiProperty({
    description: 'Unique identifier of the stock type',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  id: string;

  @ApiProperty({
    description: 'Unique code/slug of the stock type',
    example: 'preferencial',
  })
  code: string;

  @ApiProperty({
    description: 'Display name of the stock type',
    example: 'Acción Preferencial',
  })
  name: string;

  @ApiProperty({
    description:
      'Behavior of the stock type: CAPITAL_APPRECIATION or DIVIDEND_YIELD',
    enum: StockBehavior,
    example: StockBehavior.CAPITAL_APPRECIATION,
  })
  behavior: StockBehavior;

  @ApiProperty({
    description: 'Whether this stock type offers a guaranteed fixed return',
    example: true,
  })
  is_guaranteed: boolean;

  @ApiProperty({
    description: 'Guaranteed yield rate as decimal (e.g., 0.02 for 2%) or null',
    example: 0.02,
    nullable: true,
  })
  guaranteed_yield: number | null;

  @ApiProperty({
    description: 'Description of the stock type',
    example: 'Acción con rendimiento garantizado del 2% mensual',
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
