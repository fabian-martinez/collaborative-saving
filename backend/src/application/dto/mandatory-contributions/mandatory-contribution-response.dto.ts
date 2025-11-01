import { ApiProperty } from '@nestjs/swagger';

export class MandatoryContributionResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the mandatory contribution',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The type of asset for the contribution',
    example: 'stock',
  })
  assetType: string;

  @ApiProperty({
    description: 'The required amount for this contribution type',
    example: 100,
  })
  value: number;

  @ApiProperty({
    description: 'The creation timestamp',
    example: '2023-01-15T10:30:00Z',
  })
  createdAt: Date | string;

  @ApiProperty({
    description: 'The last update timestamp',
    example: '2023-01-15T10:30:00Z',
  })
  updatedAt: Date | string;
}
