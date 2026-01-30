import { ApiProperty } from '@nestjs/swagger';

export class InterestDistributionConfigResponseHttpDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ name: 'loan_type_id', example: '550e8400-e29b-41d4-a716-446655440000' })
  loan_type_id: string;

  @ApiProperty({ name: 'stock_type_id', example: '550e8400-e29b-41d4-a716-446655440000' })
  stock_type_id: string;
}
