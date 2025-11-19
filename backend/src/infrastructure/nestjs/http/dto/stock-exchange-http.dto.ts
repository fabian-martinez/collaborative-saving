import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { IsValidTargetLoanId } from '../validators/target-loan-id.validator';

export class StockExchangeHttpDto {
  @ApiPropertyOptional({
    description: 'ID de la reunión. Usa la activa si no se envía',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;

  @ApiProperty({
    description: 'ID de la suscripción desde la cual se extraen acciones',
  })
  @IsUUID()
  from_subscription_id!: string;

  @ApiProperty({
    description: 'Cantidad de acciones a convertir desde la suscripción origen',
    minimum: 0.0001,
  })
  @IsNumber()
  @IsPositive()
  from_quantity!: number;

  @ApiProperty({
    description: 'ID del tipo de acción destino',
  })
  @IsUUID()
  to_stock_id!: string;

  @ApiProperty({
    description: 'Cantidad de acciones destino que se crearán',
    minimum: 0.0001,
  })
  @IsNumber()
  @IsPositive()
  to_quantity!: number;

  @ApiPropertyOptional({
    description: 'Cómo manejar la diferencia de valor entre origen y destino',
    enum: ['cash', 'credit'],
    default: 'cash',
  })
  @IsOptional()
  @IsString()
  @IsIn(['cash', 'credit'])
  difference_handling?: 'cash' | 'credit';

  @ApiPropertyOptional({
    description:
      'Identificador del crédito a afectar o valores especiales para nuevos préstamos',
  })
  @ValidateIf(
    (dto: StockExchangeHttpDto) => dto.difference_handling === 'credit',
  )
  @IsNotEmpty()
  @IsValidTargetLoanId()
  target_loan_id?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales para la operación',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
