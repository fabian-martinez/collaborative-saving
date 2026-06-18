import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DisbursementPlanItemHttpDto } from './disbursement-plan-item-http.dto';

/**
 * HTTP DTO for Execute Disbursement Plan
 */
export class ExecuteDisbursementPlanHttpDto {
  @ApiProperty({
    description: 'Plan de desembolsos a ejecutar',
    type: [DisbursementPlanItemHttpDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisbursementPlanItemHttpDto)
  plan_items: DisbursementPlanItemHttpDto[];
}
