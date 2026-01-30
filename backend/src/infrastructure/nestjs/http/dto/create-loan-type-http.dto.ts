import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { AmortizationType } from '@domain/entities/loan-type.entity';

export class CreateLoanTypeHttpDto {
  @ApiProperty({ example: 'Préstamo Corriente' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  default_approved_amount: number;

  @ApiProperty({ example: 0.05 })
  @IsNumber()
  @Min(0)
  @Max(1)
  default_interest_rate: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(1)
  default_term: number;

  @ApiProperty({ example: 'french', enum: AmortizationType })
  @IsEnum(AmortizationType)
  amortization_type: AmortizationType;
}
