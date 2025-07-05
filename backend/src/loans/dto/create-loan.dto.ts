import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsIn,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({
    description: 'The ID of the member requesting the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  member_id: string;

  @ApiProperty({
    description: 'The type of loan',
    example: 'corriente',
    enum: ['corriente', 'agil'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['corriente', 'agil'])
  loan_type: string;

  @ApiProperty({
    description: 'The amount approved for the loan',
    example: 5000.0,
  })
  @IsNumber()
  @IsPositive()
  approved_amount: number;

  @ApiProperty({
    description:
      'The remaining balance to be paid (optional, defaults to approved_amount)',
    example: 2500,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  outstanding_balance?: number;

  @ApiProperty({
    description: 'The interest rate for the loan (e.g., 0.02 for 2%)',
    example: 0.02,
  })
  @IsNumber()
  @IsPositive()
  interest_rate: number;

  @ApiProperty({
    description: 'The initial status of the loan',
    example: 'pending',
    enum: ['pending', 'active', 'paid', 'defaulted'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['pending', 'active', 'paid', 'defaulted'])
  status?: string;
}
