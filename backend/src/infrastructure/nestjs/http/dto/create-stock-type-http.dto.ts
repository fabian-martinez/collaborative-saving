/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

export class CreateStockTypeHttpDto {
  @ApiProperty({
    description: 'Name of the stock type',
    example: 'Acción Preferencial',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      'Unique slug/code for the stock type. If omitted, it will be auto-generated from the name.',
    example: 'preferencial',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description:
      'Behavior of the stock type: CAPITAL_APPRECIATION or DIVIDEND_YIELD',
    enum: StockBehavior,
    default: StockBehavior.CAPITAL_APPRECIATION,
    example: StockBehavior.CAPITAL_APPRECIATION,
  })
  @IsOptional()
  @IsEnum(StockBehavior)
  behavior?: StockBehavior;

  @ApiPropertyOptional({
    description: 'Whether this stock type offers a guaranteed fixed return',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_guaranteed?: boolean;

  @ApiPropertyOptional({
    description:
      'Guaranteed yield rate as decimal (e.g., 0.02 for 2%). Only applicable when is_guaranteed is true.',
    example: 0.02,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  guaranteed_yield?: number | null;

  @ApiPropertyOptional({
    description: 'Optional description of the stock type',
    example: 'Acción con rendimiento garantizado del 2% mensual',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
