import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Scenario Request DTO
 */
class ScenarioRequestHttpDto {
  @ApiProperty({
    description: 'Scenario name',
    example: 'Extra payment $50,000/month',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Extra payment amount per month',
    example: 50000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_payment?: number;

  @ApiProperty({
    description: 'Month to start extra payments (1-based)',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  start_month?: number;

  @ApiProperty({
    description: 'Type of amortization',
    enum: ['french', 'german'],
    example: 'french',
    required: false,
  })
  @IsOptional()
  @IsEnum(['french', 'german'])
  amortization_type?: 'french' | 'german';
}

/**
 * Simulate Loan Scenarios Request HTTP DTO
 */
export class SimulateLoanScenariosRequestHttpDto {
  @ApiProperty({
    description: 'Array of scenarios to simulate',
    type: [ScenarioRequestHttpDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioRequestHttpDto)
  scenarios: ScenarioRequestHttpDto[];
}
