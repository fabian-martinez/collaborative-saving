/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoanTypeHttpDto {
  @ApiProperty({
    description: 'Name of the loan type',
    example: 'Préstamo Corriente',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      'Unique slug/code for the loan type. If omitted, it will be auto-generated from the name.',
    example: 'corriente',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description:
      'Default monthly interest rate as decimal (e.g., 0.015 for 1.5%)',
    example: 0.015,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  interest_rate: number;

  @ApiPropertyOptional({
    description: 'Optional description of the loan type',
    example: 'Préstamo estándar para socios',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
