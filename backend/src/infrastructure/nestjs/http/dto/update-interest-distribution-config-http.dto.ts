import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class UpdateInterestDistributionConfigHttpDto {
  @ApiPropertyOptional({
    description: 'The ID of the loan type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  loan_type_id?: string;

  @ApiPropertyOptional({
    description: 'The ID of the stock type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  stock_type_id?: string;
}
