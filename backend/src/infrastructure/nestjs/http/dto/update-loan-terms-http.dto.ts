import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  IsIn,
} from 'class-validator';

export class UpdateLoanTermsHttpDto {
  @ApiPropertyOptional({
    description:
      'New loan type (corriente, agil, accion, prioritario). Optional.',
    enum: ['corriente', 'agil', 'accion', 'prioritario'],
    example: 'corriente',
  })
  @IsOptional()
  @IsString()
  @IsIn(['corriente', 'agil', 'accion', 'prioritario'])
  loan_type?: 'corriente' | 'agil' | 'accion' | 'prioritario';
  @ApiProperty({
    description: 'New interest rate (between 0 and 1). Optional.',
    example: 0.06,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  interest_rate?: number;

  @ApiProperty({
    description: 'New monthly payment amount. Optional.',
    example: 160000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_payment_amount?: number;

  @ApiProperty({
    description: 'New loan term in months. Optional.',
    example: 18,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  term?: number;
}
