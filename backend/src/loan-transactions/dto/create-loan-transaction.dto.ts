import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { TransactionType } from '../../common/enums/transaction-type.enum';

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
    enum: TransactionType,
    example: TransactionType.PRINCIPAL_PAYMENT,
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  transaction_type: TransactionType;

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
