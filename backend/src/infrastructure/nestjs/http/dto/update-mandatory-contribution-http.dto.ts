import { IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMandatoryContributionHttpDto {
  @ApiPropertyOptional({
    description: 'The type of asset for the contribution',
    example: 'stock',
  })
  @IsOptional()
  @IsString()
  asset_type?: string;

  @ApiPropertyOptional({
    description: 'The required amount for this contribution type',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  value?: number;
}
