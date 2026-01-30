import { ApiProperty } from '@nestjs/swagger';

export class LoanTypeResponseHttpDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Préstamo Corriente' })
  name: string;

  @ApiProperty({ name: 'default_approved_amount', example: 1000 })
  default_approved_amount: number;

  @ApiProperty({ name: 'default_interest_rate', example: 0.05 })
  default_interest_rate: number;

  @ApiProperty({ name: 'default_term', example: 12 })
  default_term: number;

  @ApiProperty({ name: 'amortization_type', example: 'french', enum: ['french', 'german'] })
  amortization_type: string;
}
