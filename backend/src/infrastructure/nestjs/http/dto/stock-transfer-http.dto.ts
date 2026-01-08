import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class StockTransferHttpDto {
  @ApiPropertyOptional({
    description: 'ID de la reunión. Se usa la activa si no se proporciona',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;

  @ApiProperty({
    description: 'ID de la suscripción de origen',
  })
  @IsUUID()
  transfer_subscription_id!: string;

  @ApiProperty({
    description: 'Cantidad de acciones a transferir',
    minimum: 0.0001,
  })
  @IsNumber()
  @IsPositive()
  transfer_quantity!: number;

  @ApiProperty({
    description: 'ID del socio que recibirá las acciones',
  })
  @IsUUID()
  to_member_id!: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales para la transferencia',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
