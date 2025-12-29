import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Get Payment Schedule Query HTTP DTO
 *
 * Query parameters for retrieving payment schedule
 */
export class GetPaymentScheduleQueryHttpDto {
  @ApiPropertyOptional({
    description: 'Number of months to project forward',
    example: 12,
    default: 12,
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  months?: number;
}

