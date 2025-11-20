import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional } from 'class-validator';

/**
 * HTTP DTO for Disbursement Stock Request
 */
export class DisbursementStockRequestHttpDto {
  @ApiProperty({
    description: 'ID del stock a retirar',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  })
  @IsUUID()
  stock_id: string;

  @ApiPropertyOptional({
    description: 'Cantidad de acciones a retirar',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  stock_withdrawal_quantity?: number;
}
