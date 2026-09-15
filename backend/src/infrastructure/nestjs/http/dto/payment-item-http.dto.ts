import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { PaymentType } from '@application/dto/members/payment-item.dto';

/**
 * Payment Item HTTP DTO
 *
 * HTTP request DTO for a single payment item in a monthly payment request.
 * Each payment item corresponds to a specific payment type (e.g., loan payment, stock fee).
 */
export class PaymentItemHttpDto {
  @ApiProperty({
    description: 'The type of the payment',
    enum: PaymentType,
    example: PaymentType.STOCK_FEE,
  })
  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType;

  @ApiProperty({
    description: 'The amount of the payment',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description: 'Description of the payment',
    example: 'Cuota de acciones mensual',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Reference ID for the payment (e.g., loan ID for loan_payment, stock ID for stock_fee)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @ApiPropertyOptional({
    description: 'Comment for novelty payments',
    example: 'Novedad por falta de pago',
  })
  @IsOptional()
  @IsString()
  novelty_comment?: string;

  @ApiPropertyOptional({
    description:
      'The type of payment that is affected by this novelty (only for novelty payments). Required when type is NOVELTY and reference_id is provided.',
    enum: PaymentType,
    example: PaymentType.MANDATORY_CONTRIBUTION,
  })
  @IsOptional()
  @IsEnum(PaymentType)
  affected_payment_type?: PaymentType;

  @ApiPropertyOptional({
    description:
      'Flag indicating whether this payment is intended to fully liquidate the loan (for loan_payment).',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_full_payoff?: boolean;
}
