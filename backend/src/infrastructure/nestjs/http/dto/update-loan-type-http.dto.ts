import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, Min, Max, IsOptional } from 'class-validator';
import { AmortizationType } from '@domain/entities/loan-type.entity';

export class UpdateLoanTypeHttpDto {
  @ApiPropertyOptional({ example: 'Préstamo Corriente Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_approved_amount?: number;

  @ApiPropertyOptional({ example: 0.04 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  default_interest_rate?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  default_term?: number;

  @ApiPropertyOptional({ example: 'german', enum: AmortizationType })
  @IsOptional()
  @IsEnum(AmortizationType)
  amortization_type?: AmortizationType;
}
