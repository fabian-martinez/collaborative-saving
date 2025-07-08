import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsPositive,
  IsNotEmpty,
  IsIn,
  IsUUID,
  IsOptional,
} from 'class-validator';

export const PaymentType = [
  'mandatory_contribution',
  'stock_fee',
  'loan_payment',
  'fee',
  'insurance',
] as const;

export class CreateTransactionPaymentDto {
  @ApiProperty({
    description: 'The type of the payment transaction',
    enum: PaymentType,
    example: 'loan_payment',
  })
  @IsIn(PaymentType)
  @IsNotEmpty()
  type: (typeof PaymentType)[number];

  @ApiProperty({
    description: 'A description for the payment',
    example: 'Payment for loan #123',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The amount of the payment',
    example: 250.0,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description:
      'An optional reference ID (e.g., the loan ID for a loan_payment)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  referenceId?: string;
}
