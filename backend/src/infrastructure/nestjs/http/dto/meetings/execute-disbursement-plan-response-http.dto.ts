import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

/**
 * HTTP Response DTO for Execute Disbursement Plan
 */
export class ExecuteDisbursementPlanResponseHttpDto {
  @ApiProperty({
    description: 'Indica si la ejecución fue exitosa',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Número de items procesados',
    example: 5,
  })
  @IsNumber()
  processed_items: number;

  @ApiPropertyOptional({
    description: 'Total desembolsado',
    example: 5000.0,
  })
  @IsNumber()
  @IsOptional()
  total_disbursed?: number;

  @ApiPropertyOptional({
    description: 'Total solicitado',
    example: 5500.0,
  })
  @IsNumber()
  @IsOptional()
  total_requested?: number;
}
