import { ApiProperty } from '@nestjs/swagger';
import { NewStockValueDto } from './new-stock-value.dto';

export class RevaluateAssetsResponseDto {
  @ApiProperty({
    description: 'The calculated revaluation rate',
    example: 0.15,
  })
  revaluationRate: number;

  @ApiProperty({
    description: 'A list of all stock types with their new values',
    type: [NewStockValueDto],
  })
  newStockValues: NewStockValueDto[];
}
