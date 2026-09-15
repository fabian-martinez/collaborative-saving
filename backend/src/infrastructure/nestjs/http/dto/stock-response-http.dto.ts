/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';
import { StockBehavior } from '@domain/entities/stock.entity';

export class StockResponseHttpDto {
  @ApiProperty({
    description: 'Unique identifier of the stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Descriptive name of the stock',
    example: 'Acción Ordinaria',
  })
  name: string;

  @ApiProperty({
    description: 'Type identifier for backward compatibility',
    example: 'Acción Ordinaria',
  })
  type: string;

  @ApiProperty({
    description: 'Identifier of the associated StockType',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
    required: false,
  })
  stock_type_id?: string | null;

  @ApiProperty({
    description: 'Current nominal value of the stock',
    example: 100.0,
  })
  value: number;

  @ApiProperty({
    description: 'Monthly mandatory contribution amount',
    example: 50.0,
  })
  monthly_contribution: number;

  @ApiProperty({
    description: 'Whether the stock has a guaranteed yield',
    example: false,
  })
  is_guaranteed: boolean;

  @ApiProperty({
    description: 'Guaranteed yield rate if guaranteed',
    example: 0.02,
    nullable: true,
  })
  guaranteed_yield: number | null;

  @ApiProperty({
    description: 'Financial behavior: CAPITAL_APPRECIATION or DIVIDEND_YIELD',
    enum: StockBehavior,
    example: StockBehavior.CAPITAL_APPRECIATION,
  })
  behavior: StockBehavior;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  created_at: Date;
}
