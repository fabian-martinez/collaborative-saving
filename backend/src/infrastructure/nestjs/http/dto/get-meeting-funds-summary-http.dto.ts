/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CollectedThisMeetingHttpDto {
  @ApiProperty({
    description: 'Abono a capital recaudado en la reunión',
    example: 50000,
  })
  @IsNumber()
  principal: number;

  @ApiProperty({
    description: 'Intereses recaudados en la reunión',
    example: 7500,
  })
  @IsNumber()
  interest: number;

  @ApiProperty({
    description: 'Total recaudado (capital + intereses)',
    example: 57500,
  })
  @IsNumber()
  total: number;
}

export class LoanFundSummaryHttpDto {
  @ApiProperty({
    description:
      'Código del tipo de préstamo (ej. corriente, prioritario, agil, accion)',
    example: 'corriente',
  })
  @IsString()
  loan_type: string;

  @ApiProperty({
    description: 'Nombre descriptivo del tipo de préstamo',
    example: 'Corriente',
  })
  @IsString()
  loan_type_name: string;

  @ApiProperty({
    description: 'Saldo pendiente actual en cartera activa',
    example: 1200000,
  })
  @IsNumber()
  outstanding_balance: number;

  @ApiProperty({
    type: CollectedThisMeetingHttpDto,
    description:
      'Detalle del recaudo de la reunión actual para este tipo de préstamo',
  })
  @ValidateNested()
  @Type(() => CollectedThisMeetingHttpDto)
  collected_this_meeting: CollectedThisMeetingHttpDto;

  @ApiProperty({
    description: 'Cantidad de créditos activos de este tipo',
    example: 3,
  })
  @IsNumber()
  active_count: number;
}

export class StockFundSummaryHttpDto {
  @ApiProperty({
    description: 'ID de la acción',
    example: 'd3b07384-d113-40e1-bb9b-b6d3663a8637',
  })
  @IsUUID()
  stock_id: string;

  @ApiProperty({
    description: 'Nombre de la acción',
    example: 'Acciones Ordinarias',
  })
  @IsString()
  stock_name: string;

  @ApiProperty({
    description: 'Tipo de la acción',
    example: 'Acciones Ordinarias',
  })
  @IsString()
  stock_type: string;

  @ApiProperty({
    description: 'Indica si la acción tiene rentabilidad garantizada',
    example: false,
  })
  @IsBoolean()
  is_guaranteed: boolean;

  @ApiProperty({
    description: 'Total de acciones activas en circulación',
    example: 100,
  })
  @IsNumber()
  total_shares: number;

  @ApiProperty({
    description: 'Valor patrimonial unitario por acción',
    example: 10000,
  })
  @IsNumber()
  share_value: number;

  @ApiProperty({
    description: 'Valor total en acciones (total_shares * share_value)',
    example: 1000000,
  })
  @IsNumber()
  total_value: number;

  @ApiProperty({
    description: 'Cantidad de suscripciones activas',
    example: 10,
  })
  @IsNumber()
  active_subscriptions_count: number;
}

export class GetMeetingFundsSummaryHttpDto {
  @ApiPropertyOptional({
    description: 'ID de la reunión',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;

  @ApiProperty({
    type: [LoanFundSummaryHttpDto],
    description: 'Resumen de cartera agrupado por tipo de préstamo',
  })
  @ValidateNested({ each: true })
  @Type(() => LoanFundSummaryHttpDto)
  loans_by_type: LoanFundSummaryHttpDto[];

  @ApiProperty({
    type: [StockFundSummaryHttpDto],
    description: 'Resumen patrimonial agrupado por tipo de acción',
  })
  @ValidateNested({ each: true })
  @Type(() => StockFundSummaryHttpDto)
  stocks_by_type: StockFundSummaryHttpDto[];
}

export { GetMeetingFundsSummaryHttpDto as MeetingFundsSummaryHttpDto };
