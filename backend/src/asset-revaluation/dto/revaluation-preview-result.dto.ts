import { ApiProperty } from '@nestjs/swagger';

export class MandatoryContributionByTypeDto {
  @ApiProperty({ example: '123', description: 'ID del aporte obligatorio' })
  mandatory_contribution_id: string;

  @ApiProperty({ example: 1000, description: 'Total aportado para este tipo' })
  total: number;
}

export class RevaluationDetailDto {
  @ApiProperty({ example: 'stock-1', description: 'ID de la acción' })
  stock_id: string;

  @ApiProperty({ example: 'Acción A', description: 'Tipo de acción' })
  type: string;

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
}

export class RevaluationPreviewResultDto {
  @ApiProperty({ example: 10000, description: 'Total de aportes por acciones' })
  total_contributions: number;

  @ApiProperty({ example: 5000, description: 'Total de intereses' })
  total_interest: number;

  @ApiProperty({ example: 15000, description: 'Total a distribuir' })
  total_to_distribute: number;

  @ApiProperty({ type: [RevaluationDetailDto] })
  details: RevaluationDetailDto[];

  @ApiProperty({ example: 2000, description: 'Total de aportes obligatorios' })
  total_mandatory_contributions: number;

  @ApiProperty({ type: [MandatoryContributionByTypeDto], required: false })
  mandatory_contributions_by_type?: MandatoryContributionByTypeDto[];
}
