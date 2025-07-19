import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsIn,
} from 'class-validator';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Decorador personalizado para validar targetLoanId
function IsValidTargetLoanId(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isValidTargetLoanId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true; // Permitir valores vacíos

          // Valores especiales permitidos
          const specialValues = ['new_action_loan', 'new_current_loan'];
          if (specialValues.includes(value)) return true;

          // Validar UUID
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid UUID or one of the special values: new_action_loan, new_current_loan`;
        },
      },
    });
  };
}

export class StockModificationDto {
  @ApiProperty({
    description: 'The ID of the member performing the modification',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({
    description: 'The ID of the meeting where the modification occurs',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  meetingId: string;

  @ApiProperty({
    description: 'The type of modification',
    example: 'STOCK_MODIFICATION',
    enum: ['STOCK_MODIFICATION', 'STOCK_TRANSFER', 'STOCK_LOAN_PAYMENT'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['STOCK_MODIFICATION', 'STOCK_TRANSFER', 'STOCK_LOAN_PAYMENT'])
  modificationType: string;

  // For stock modifications (exchanges)
  @ApiProperty({
    description: 'The ID of the stock subscription to exchange from',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  fromSubscriptionId?: string;

  @ApiProperty({
    description: 'The quantity of stocks to exchange from',
    example: 2,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  fromQuantity?: number;

  @ApiProperty({
    description: 'The ID of the stock to exchange to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  toStockId?: string;

  @ApiProperty({
    description: 'The quantity of stocks to exchange to',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  toQuantity?: number;

  // For stock transfers
  @ApiProperty({
    description: 'The ID of the stock subscription to transfer',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  transferSubscriptionId?: string;

  @ApiProperty({
    description: 'The quantity of stocks to transfer',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  transferQuantity?: number;

  @ApiProperty({
    description: 'The ID of the member to transfer stocks to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  toMemberId?: string;

  // For stock loan payments
  @ApiProperty({
    description: 'The ID of the stock subscription to use for loan payment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  loanPaymentSubscriptionId?: string;

  @ApiProperty({
    description: 'The quantity of stocks to use for loan payment',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  loanPaymentQuantity?: number;

  @ApiProperty({
    description: 'The ID of the loan to pay',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  // For handling differences in modifications
  @ApiProperty({
    description: 'How to handle the difference in stock values',
    example: 'cash',
    enum: ['cash', 'credit'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['cash', 'credit'])
  differenceHandling?: string;

  @ApiProperty({
    description:
      'The ID of the loan to apply difference to (if differenceHandling is credit) or special values for new loans',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsValidTargetLoanId()
  targetLoanId?: string;

  @ApiProperty({
    description: 'Additional notes for the modification',
    example: 'Modificación de acciones con cruce de crédito',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
