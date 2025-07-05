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

export class CreateLoanTransactionDto {
  @ApiProperty({
    description: 'The ID of the loan this transaction belongs to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  loan_id: string;

  @ApiProperty({
    description: 'The type of loan transaction',
    enum: ['desembolso', 'abono_capital', 'pago_interes'],
    example: 'abono_capital',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['desembolso', 'abono_capital', 'pago_interes'])
  transaction_type: string;

  @ApiProperty({
    description: 'The amount of the transaction',
    example: 300.0,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Optional notes for the transaction',
    example: 'Regular monthly payment',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
