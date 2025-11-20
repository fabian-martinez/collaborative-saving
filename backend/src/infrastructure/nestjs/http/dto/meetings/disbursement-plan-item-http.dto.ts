import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DisbursementStockRequestHttpDto } from './disbursement-stock-request-http.dto';
import { NewLoanRequestHttpDto } from './new-loan-request-http.dto';

/**
 * HTTP DTO Enum for Disbursement Type
 */
export enum DisbursementTypeHttp {
  DIVIDEND = 'dividend',
  WITHDRAWAL = 'withdrawal',
  LOAN = 'loan',
  OTHER = 'other',
}

/**
 * HTTP DTO for Disbursement Plan Item
 */
export class DisbursementPlanItemHttpDto {
  @ApiProperty({
    description: 'ID del socio',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @IsUUID()
  @IsNotEmpty()
  member_id: string;

  @ApiProperty({
    description: 'Tipo de desembolso',
    example: 'dividend',
    enum: DisbursementTypeHttp,
  })
  @IsEnum(DisbursementTypeHttp)
  @IsNotEmpty()
  type: DisbursementTypeHttp;

  @ApiProperty({
    description: 'Monto a desembolsar',
    example: 120.0,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    description: 'Estado del desembolso',
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'ID del préstamo (para desembolsos de préstamos pendientes)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @IsOptional()
  @IsUUID()
  loan_id?: string;

  @ApiPropertyOptional({
    description: 'ID de la suscripción de acciones',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  })
  @IsOptional()
  @IsUUID()
  stock_subscription_id?: string;

  @ApiPropertyOptional({
    description: 'ID del pago pendiente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  })
  @IsOptional()
  @IsUUID()
  pending_member_payment_id?: string;

  @ApiPropertyOptional({
    description: 'Información de retiro de acciones',
    type: DisbursementStockRequestHttpDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DisbursementStockRequestHttpDto)
  disbursement_stock_request?: DisbursementStockRequestHttpDto;

  @ApiPropertyOptional({
    description: 'Información de nuevo préstamo',
    type: NewLoanRequestHttpDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewLoanRequestHttpDto)
  new_loan_request?: NewLoanRequestHttpDto;
}
