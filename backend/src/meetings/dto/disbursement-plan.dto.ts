import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DisbursementType {
  DIVIDEND = 'dividend',
  WITHDRAWAL = 'withdrawal',
  LOAN = 'loan',
  OTHER = 'other',
}

export class NewLoanRequestDto {
  @ApiProperty({
    description: 'ID del socio que solicita el préstamo',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @IsUUID()
  memberId: string;

  @ApiProperty({ description: 'Monto solicitado', example: 5000.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Tipo de préstamo',
    example: 'corriente',
    enum: ['corriente', 'agil', 'accion', 'prioritario'],
  })
  @IsString()
  loanType: string;

  @ApiProperty({ description: 'Monto aprobado', example: 5000.0 })
  @IsNumber()
  approvedAmount: number;

  @ApiProperty({ description: 'Cuota mensual', example: 250.0 })
  @IsNumber()
  monthlyPaymentAmount: number;

  @ApiProperty({ description: 'Tasa de interés', example: 0.02 })
  @IsNumber()
  interestRate: number;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DisbursementStockRequestDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  @IsUUID()
  stockId: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  stockWithdrawalQuantity?: number;
}

export class DisbursementPlanItemDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  @IsUUID()
  memberId: string;

  @ApiProperty({ example: 'dividendo', enum: DisbursementType })
  @IsEnum(DisbursementType)
  type: DisbursementType;

  @ApiProperty({ example: 120.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'pending', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Notas adicionales', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  @IsUUID()
  @IsOptional()
  stockSubscriptionId?: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  @IsUUID()
  @IsOptional()
  pendingMemberPaymentId?: string;

  @ApiProperty({ type: () => DisbursementStockRequestDto, required: false })
  @ValidateNested()
  @Type(() => DisbursementStockRequestDto)
  @IsOptional()
  disbursementStockRequest?: DisbursementStockRequestDto;

  @ApiProperty({ type: () => NewLoanRequestDto, required: false })
  @ValidateNested()
  @Type(() => NewLoanRequestDto)
  @IsOptional()
  newLoanRequest?: NewLoanRequestDto;
}

export class DisbursementPlanPreviewResponseDto {
  @ApiProperty({ type: [DisbursementPlanItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisbursementPlanItemDto)
  plan: DisbursementPlanItemDto[];

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  availableCash: number;

  @ApiProperty({ example: 900.0 })
  @IsNumber()
  totalToDisburse: number;
}

export class ExecuteDisbursementPlanDto {
  @ApiProperty({ type: [DisbursementPlanItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisbursementPlanItemDto)
  plan: DisbursementPlanItemDto[];
}
