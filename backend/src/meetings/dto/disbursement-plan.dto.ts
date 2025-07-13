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
  DIVIDENDO = 'dividendo',
  RETIRO_ACCION = 'retiro_accion',
  OTRO = 'otro',
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
