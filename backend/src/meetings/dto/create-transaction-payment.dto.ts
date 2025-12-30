import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsPositive,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { PaymentType } from '../../domain/enums/payment-type.enum';

export class CreateTransactionPaymentDto {
  @ApiProperty({
    description: 'The type of the payment transaction',
    enum: PaymentType,
    example: 'loan_payment',
  })
  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType;

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
