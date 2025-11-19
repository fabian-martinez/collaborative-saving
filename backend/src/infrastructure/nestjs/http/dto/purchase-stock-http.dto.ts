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

class LoanDetailsHttpDto {
  @ApiProperty({
    description: 'Tasa de interés para el nuevo crédito (ej: 0.02 para 2%)',
    example: 0.02,
  })
  @IsNumber()
  @IsPositive()
  interest_rate: number;

  @ApiProperty({
    description: 'Tipo de crédito (debe ser "accion" para compra de acciones)',
    example: 'accion',
    enum: ['accion'],
  })
  @IsEnum(['accion'])
  loan_type: 'accion';
}

/**
 * Purchase Stock HTTP DTO
 *
 * HTTP request DTO for purchasing stocks.
 * Note: memberId is not included here as it comes from the URL path parameter.
 */
export class PurchaseStockHttpDto {
  @ApiProperty({
    description: 'The ID of the stock to purchase',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  stock_id: string;

  @ApiProperty({
    description: 'The quantity of stocks to purchase',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'The amount paid in cash',
    example: 100000,
  })
  @IsNumber()
  @Min(0)
  cash_amount: number;

  @ApiPropertyOptional({
    description:
      'Loan details if part of the purchase is financed. Required if cash_amount < total_value',
    type: LoanDetailsHttpDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoanDetailsHttpDto)
  loan_details?: LoanDetailsHttpDto;

  @ApiPropertyOptional({
    description:
      'Optional meeting ID. If not provided, the active meeting will be used',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;
}
