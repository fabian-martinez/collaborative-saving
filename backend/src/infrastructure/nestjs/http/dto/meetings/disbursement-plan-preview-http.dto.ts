import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DisbursementPlanItemHttpDto } from './disbursement-plan-item-http.dto';

/**
 * HTTP Response DTO for Disbursement Plan Preview
 */
export class DisbursementPlanPreviewResponseHttpDto {
  @ApiProperty({
    description: 'Plan de desembolsos pendientes',
    type: [DisbursementPlanItemHttpDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisbursementPlanItemHttpDto)
  plan: DisbursementPlanItemHttpDto[];

  @ApiProperty({
    description: 'Efectivo disponible en la reunión',
    example: 1000.0,
  })
  @IsNumber()
  available_cash: number;

  @ApiProperty({
    description: 'Total a desembolsar',
    example: 900.0,
  })
  @IsNumber()
  total_to_disburse: number;
}
