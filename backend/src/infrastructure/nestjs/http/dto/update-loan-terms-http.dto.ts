import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateLoanTermsHttpDto {
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

