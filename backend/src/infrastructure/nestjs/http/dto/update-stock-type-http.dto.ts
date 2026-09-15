/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

export class UpdateStockTypeHttpDto {
  @ApiPropertyOptional({
    description: 'Updated display name of the stock type',
    example: 'Acción Preferencial Serie A',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description:
      'Behavior of the stock type: CAPITAL_APPRECIATION or DIVIDEND_YIELD',
    enum: StockBehavior,
    example: StockBehavior.DIVIDEND_YIELD,
  })
  @IsOptional()
  @IsEnum(StockBehavior)
  behavior?: StockBehavior;

  @ApiPropertyOptional({
    description: 'Whether this stock type offers a guaranteed fixed return',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_guaranteed?: boolean;

  @ApiPropertyOptional({
    description:
      'Guaranteed yield rate as decimal (e.g., 0.02 for 2%). Only applicable when is_guaranteed is true.',
    example: 0.025,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  guaranteed_yield?: number | null;

  @ApiPropertyOptional({
    description: 'Updated description of the stock type',
    example: 'Nueva descripción',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}
