import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, Min, Max } from 'class-validator';

/**
 * Payment Plan Request HTTP DTO
 */
export class PaymentPlanRequestHttpDto {
  @ApiProperty({
    description: 'Loan principal amount',
    example: 1000000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  principal: number;

  @ApiProperty({
    description: 'Monthly interest rate as decimal (e.g., 0.01 for 1%)',
    example: 0.01,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @ApiProperty({
    description: 'Loan term in months',
    example: 12,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  term: number;

  @ApiProperty({
    description: 'Type of amortization',
    enum: ['french', 'german'],
    example: 'french',
  })
  @IsEnum(['french', 'german'])
  amortization_type: 'french' | 'german';
}
