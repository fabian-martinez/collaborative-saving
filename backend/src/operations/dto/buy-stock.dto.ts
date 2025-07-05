import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidateNested,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class LoanDetailsDto {
  @ApiProperty({
    description: 'The interest rate for the new loan (e.g., 0.02 for 2%)',
    example: 0.01,
  })
  @IsNumber()
  @IsPositive()
  interest_rate: number;

  @ApiProperty({
    description: 'The type of loan',
    example: 'corriente',
    enum: ['corriente', 'agil'],
  })
  @IsEnum(['corriente', 'agil'])
  loan_type: 'corriente' | 'agil';
}

export class BuyStockDto {
  @ApiProperty({ description: "The member's ID", example: '...' })
  @IsUUID()
  memberId: string;

  @ApiProperty({ description: "The stock's ID to purchase", example: '...' })
  @IsUUID()
  stockId: string;

  @ApiProperty({ description: 'The quantity of stock to purchase' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'The amount paid in cash towards the purchase',
    example: 1000,
  })
  @IsNumber()
  @Min(0)
  cashAmount: number;

  @ApiPropertyOptional({
    description:
      'Details for the loan if part of the purchase is financed. Required if cashAmount is less than the total purchase value.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoanDetailsDto)
  loanDetails?: LoanDetailsDto;
}
