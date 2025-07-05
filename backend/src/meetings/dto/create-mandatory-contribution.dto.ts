import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive } from 'class-validator';

export class CreateMandatoryContributionDto {
  @ApiProperty({
    description:
      'The type of asset for the contribution (e.g., stock, savings)',
    example: 'stock',
  })
  @IsString()
  asset_type: string;

  @ApiProperty({
    description: 'The total amount required for this contribution type',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  total: number;
}
