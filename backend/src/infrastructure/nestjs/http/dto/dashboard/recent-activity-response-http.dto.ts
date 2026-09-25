import { ApiProperty } from '@nestjs/swagger';

export class RecentActivityResponseHttpDto {
  @ApiProperty({
    description: 'Unique identifier of the operation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Type of operation',
    example: 'MANDATORY_CONTRIBUTION',
  })
  type: string;

  @ApiProperty({
    description: 'Description of the activity',
    example: 'Aporte mensual de María González',
  })
  description: string;

  @ApiProperty({
    description: 'Monetary amount involved in the activity',
    example: 150000,
  })
  amount: number;

  @ApiProperty({
    description: 'ISO timestamp of when the activity occurred',
    example: '2024-03-01T10:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Name of the member associated with the activity',
    example: 'María González',
  })
  member_name: string;
}
