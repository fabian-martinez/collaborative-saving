import { ApiProperty } from '@nestjs/swagger';

export class StockTypeResponseHttpDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Acción Ordinaria' })
  name: string;

  @ApiProperty({ example: 'CAPITAL_APPRECIATION', enum: ['CAPITAL_APPRECIATION', 'DIVIDEND_YIELD'] })
  behavior: string;
}
