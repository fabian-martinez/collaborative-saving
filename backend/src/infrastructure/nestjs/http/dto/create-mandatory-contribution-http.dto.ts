import { IsNotEmpty, IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMandatoryContributionHttpDto {
  @ApiProperty({
    description: 'The type of asset for the contribution',
    example: 'stock',
  })
  @IsNotEmpty()
  @IsString()
  asset_type: string;

  @ApiProperty({
    description: 'The required amount for this contribution type',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  value: number;
}
