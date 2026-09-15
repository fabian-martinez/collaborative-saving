/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLoanTypeHttpDto {
  @ApiPropertyOptional({
    description: 'Name of the loan type',
    example: 'Préstamo Corriente Actualizado',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description:
      'Default monthly interest rate as decimal (e.g., 0.02 for 2.0%)',
    example: 0.02,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  interest_rate?: number;

  @ApiPropertyOptional({
    description: 'Optional description of the loan type',
    example: 'Nueva descripción',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
