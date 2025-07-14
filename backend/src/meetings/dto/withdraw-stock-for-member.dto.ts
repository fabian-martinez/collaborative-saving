import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class WithdrawStockForMemberDto {
  @ApiProperty({
    description: 'ID del socio que solicita el retiro',
    example: '...',
  })
  @IsUUID()
  memberId: string;

  @ApiProperty({
    description: 'ID de la acción a retirar',
    example: '...',
  })
  @IsUUID()
  stockId: string;

  @ApiProperty({
    description: 'Cantidad de acciones a retirar',
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales para el retiro',
  })
  @IsOptional()
  notes?: string;
}
