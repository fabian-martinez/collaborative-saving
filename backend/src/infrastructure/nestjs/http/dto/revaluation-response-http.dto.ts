import { ApiProperty } from '@nestjs/swagger';

export class RevaluationDetailHttpDto {
  @ApiProperty({ example: 'stock-1', description: 'ID de la acción' })
  stock_id: string;

  @ApiProperty({ example: 'Acción A', description: 'Nombre de la acción' })
  name: string;

  @ApiProperty({ example: true, description: 'Si la acción es garantizada' })
  is_guaranteed: boolean;

  @ApiProperty({ example: 10, description: 'Total de acciones' })
  total_shares: number;

  @ApiProperty({ example: 100, description: 'Valor anterior de la acción' })
  previous_value: number;

  @ApiProperty({ example: 5, description: 'Crecimiento por aportes' })
  growth_from_contributions: number;

  @ApiProperty({ example: 3, description: 'Crecimiento por intereses' })
  growth_from_interest: number;

  @ApiProperty({ example: 8, description: 'Crecimiento total por acción' })
  total_growth_per_share: number;

  @ApiProperty({ example: 2, description: 'Crecimiento estimado por aportes' })
  estimated_growth_from_contributions: number;

  @ApiProperty({ example: 108, description: 'Nuevo valor de la acción' })
  new_value: number;

  @ApiProperty({
    example: 0,
    required: false,
    description:
      'Total de dividendos generados para esta acción (solo si es DIVIDEND_YIELD)',
  })
  dividends_generated?: number;
}

export class MandatoryContributionByTypeHttpDto {
  @ApiProperty({ example: '123', description: 'ID del aporte obligatorio' })
  mandatory_contribution_id: string;

  @ApiProperty({ example: 1000, description: 'Total aportado para este tipo' })
  total: number;
}

export class RevaluationResponseHttpDto {
  @ApiProperty({ example: 10000, description: 'Total de aportes por acciones' })
  total_contributions: number;

  @ApiProperty({ example: 5000, description: 'Total de intereses' })
  total_interest: number;

  @ApiProperty({ example: 15000, description: 'Total a distribuir' })
  total_to_distribute: number;

  @ApiProperty({ type: [RevaluationDetailHttpDto] })
  details: RevaluationDetailHttpDto[];

  @ApiProperty({ example: 2000, description: 'Total de aportes obligatorios' })
  total_mandatory_contributions: number;

  @ApiProperty({
    type: [MandatoryContributionByTypeHttpDto],
    required: false,
  })
  mandatory_contributions_by_type?: MandatoryContributionByTypeHttpDto[];

  @ApiProperty({
    example: 'preview',
    enum: ['preview', 'executed'],
    description: 'Estado de la revaluación: preview o executed',
  })
  status: 'preview' | 'executed';

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    required: false,
    description: 'Fecha de ejecución de la revaluación',
  })
  executed_at?: string;

  @ApiProperty({
    example: 'operation-123',
    required: false,
    description: 'ID de la operación de revaluación ejecutada',
  })
  operation_id?: string;
}
