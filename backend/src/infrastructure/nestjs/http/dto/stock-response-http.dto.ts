import { ApiProperty } from '@nestjs/swagger';

export class StockResponseHttpDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Acciones Ordinarias' })
  name: string;

  @ApiProperty({ example: 100000 })
  value: number;

  @ApiProperty({ example: 50000 })
  monthly_contribution: number;

  @ApiProperty({ example: true })
  is_guaranteed: boolean;

  @ApiProperty({ example: 0.05, required: false, nullable: true })
  guaranteed_yield: number | null;

  @ApiProperty()
  created_at: Date;
}
