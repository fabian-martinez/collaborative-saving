import { ApiProperty } from '@nestjs/swagger';

export class DebtCapacityResponseDto {
  @ApiProperty({
    description: 'The member ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  memberId: string;

  @ApiProperty({
    description: 'The member name',
    example: 'Fabian Martinez',
  })
  memberName: string;

  @ApiProperty({
    description: 'Total savings (stocks value)',
    example: 5000.0,
  })
  totalSavings: number;

  @ApiProperty({
    description: 'Total credits (loans outstanding balance)',
    example: 2500.0,
  })
  totalCredits: number;

  @ApiProperty({
    description: 'Available debt capacity',
    example: 2500.0,
  })
  availableCapacity: number;

  @ApiProperty({
    description: 'Total debt capacity (based on savings)',
    example: 5000.0,
  })
  totalCapacity: number;

  @ApiProperty({
    description: 'Percentage of capacity utilization',
    example: 50.0,
  })
  utilization: number;

  @ApiProperty({
    description: 'Credit status based on utilization',
    example: 'good',
    enum: ['excellent', 'good', 'moderate', 'high'],
  })
  creditStatus: string;

  @ApiProperty({
    description: 'Calculation date',
    example: '2024-01-15T10:30:00Z',
  })
  calculatedAt: Date;
}
