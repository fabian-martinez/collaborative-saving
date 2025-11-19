import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class StockLoanPaymentHttpDto {
  @ApiPropertyOptional({
    description:
      'ID de la reunión. Se utilizará la reunión activa si no se envía',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;

  @ApiProperty({
    description: 'ID de la suscripción que se utilizará para pagar el préstamo',
  })
  @IsUUID()
  subscription_id!: string;

  @ApiProperty({
    description: 'Cantidad de acciones a aplicar al préstamo',
    minimum: 0.0001,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: 'ID del préstamo que se amortizará',
  })
  @IsUUID()
  loan_id!: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales del pago',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
