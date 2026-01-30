import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateInterestDistributionConfigHttpDto {
  @ApiProperty({
    description: 'The ID of the loan type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  loan_type_id: string;

  @ApiProperty({
    description: 'The ID of the stock type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  stock_type_id: string;
}
