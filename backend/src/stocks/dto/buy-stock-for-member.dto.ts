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
    description: 'Tasa de interés para el nuevo crédito (ej: 0.02 para 2%)',
    example: 0.02,
  })
  @IsNumber()
  @IsPositive()
  interest_rate: number;

  @ApiProperty({
    description: 'Tipo de crédito',
    example: 'corriente',
    enum: ['corriente', 'agil'],
  })
  @IsEnum(['corriente', 'agil', 'accion'])
  loan_type: 'corriente' | 'agil' | 'accion';
}

export class BuyStockForMemberDto {
  @ApiProperty({ description: 'ID del socio que compra', example: '...' })
  @IsUUID()
  memberId: string;

  @ApiProperty({ description: 'ID de la acción a comprar', example: '...' })
  @IsUUID()
  stockId: string;

  @ApiProperty({ description: 'Cantidad de acciones a comprar' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Monto pagado en efectivo', example: 1000 })
  @IsNumber()
  @Min(0)
  cashAmount: number;

  @ApiPropertyOptional({
    description: 'Detalles del crédito si parte de la compra es financiada.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoanDetailsDto)
  loanDetails?: LoanDetailsDto;
}
