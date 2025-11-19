import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsIn,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * Create Loan HTTP DTO
 *
 * HTTP request DTO for creating a new loan.
 */
export class CreateLoanHttpDto {
  @ApiProperty({
    description: 'The ID of the member requesting the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  member_id: string;

  @ApiProperty({
    description: 'The ID of the meeting where the loan is being created',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  meeting_id: string;

  @ApiProperty({
    description: 'The type of loan',
    example: 'corriente',
    enum: ['corriente', 'agil', 'accion'],
  })
  @IsIn(['corriente', 'agil', 'accion'])
  loan_type: 'corriente' | 'agil' | 'accion';

  @ApiProperty({
    description: 'The amount approved for the loan',
    example: 5000.0,
  })
  @IsNumber()
  @IsPositive()
  approved_amount: number;

  @ApiProperty({
    description: 'The monthly payment amount for the loan',
    example: 250.0,
  })
  @IsNumber()
  @Min(0)
  monthly_payment_amount: number;

  @ApiProperty({
    description: 'The interest rate for the loan (e.g., 0.02 for 2%)',
    example: 0.02,
  })
  @IsNumber()
  @IsPositive()
  interest_rate: number;

  @ApiProperty({
    description: 'The term of the loan in months',
    example: 24,
  })
  @IsNumber()
  @IsPositive()
  term: number;

  @ApiPropertyOptional({
    description: 'The ID of the stock that guarantees this loan, if any',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  guaranteed_stock_id?: string | null;

  @ApiPropertyOptional({
    description:
      'The amount already disbursed (optional, defaults to approved_amount)',
    example: 2500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  disbursed_amount?: number;

  @ApiPropertyOptional({
    description:
      'The remaining balance to be paid (optional, defaults to approved_amount)',
    example: 2500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  outstanding_balance?: number;
}
