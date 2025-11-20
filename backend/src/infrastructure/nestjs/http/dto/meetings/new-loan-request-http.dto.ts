import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsString,
  IsIn,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

/**
 * HTTP DTO for New Loan Request
 */
export class NewLoanRequestHttpDto {
  @ApiProperty({
    description: 'ID del socio que solicita el préstamo',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @IsUUID()
  @IsNotEmpty()
  member_id: string;

  @ApiProperty({
    description: 'Monto solicitado',
    example: 5000.0,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Tipo de préstamo',
    example: 'corriente',
    enum: ['corriente', 'agil', 'accion', 'prioritario'],
  })
  @IsString()
  @IsIn(['corriente', 'agil', 'accion', 'prioritario'])
  @IsNotEmpty()
  loan_type: 'corriente' | 'agil' | 'accion' | 'prioritario';

  @ApiProperty({
    description: 'Monto aprobado',
    example: 5000.0,
  })
  @IsNumber()
  @IsNotEmpty()
  approved_amount: number;

  @ApiProperty({
    description: 'Cuota mensual',
    example: 250.0,
  })
  @IsNumber()
  @IsNotEmpty()
  monthly_payment_amount: number;

  @ApiProperty({
    description: 'Tasa de interés',
    example: 0.02,
  })
  @IsNumber()
  @IsNotEmpty()
  interest_rate: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
