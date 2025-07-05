import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateStockDto {
  @ApiProperty({
    description: 'The type or name of the stock',
    example: 'preferential',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'The initial value of one stock unit',
    example: 100.0,
  })
  @IsNumber()
  @IsPositive()
  value: number;

  @ApiProperty({
    description: 'The mandatory monthly contribution for this stock type',
    example: 50.0,
  })
  @IsNumber()
  @Min(0)
  monthly_contribution: number;
}
