import { ApiProperty } from '@nestjs/swagger';

export class MonthlyMovementHttpDto {
  @ApiProperty({ description: 'The label for the movement (e.g. month name)', example: 'Jul' })
  label: string;

  @ApiProperty({ description: 'Total amount collected in the period', example: 6000000 })
  collected: number;

  @ApiProperty({ description: 'Total amount disbursed in the period', example: 4500000 })
  disbursed: number;
}

export class GetMonthlyMovementsResponseHttpDto {
  @ApiProperty({ description: 'Array of monthly movements', type: [MonthlyMovementHttpDto] })
  movements: MonthlyMovementHttpDto[];

  @ApiProperty({ description: 'Labels for the movements', example: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] })
  labels: string[];

  @ApiProperty({ description: 'Collected amounts per label', example: [6000000, 6500000, 7000000, 7500000, 8000000, 8750000] })
  collected: number[];

  @ApiProperty({ description: 'Disbursed amounts per label', example: [4500000, 5000000, 5500000, 6000000, 6500000, 7000000] })
  disbursed: number[];
}
