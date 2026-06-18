import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateLoanApprovedAmountHttpDto {
  @ApiProperty({
    description: 'Nuevo monto aprobado para el préstamo',
    example: 8000.0,
  })
  @IsNumber()
  @IsPositive()
  new_approved_amount: number;
}
