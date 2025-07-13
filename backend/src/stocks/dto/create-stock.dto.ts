import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { StockBehavior } from '../entities/stock.entity';

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
  @Min(0)
  value: number;

  @ApiProperty({
    description: 'The mandatory monthly contribution for this stock type',
    example: 50.0,
  })
  @IsNumber()
  @Min(0)
  monthly_contribution: number;

  @ApiProperty({
    description:
      'Comportamiento de la acción: apreciación de capital o dividendos',
    enum: StockBehavior,
    default: StockBehavior.CAPITAL_APPRECIATION,
    required: false,
  })
  @IsEnum(StockBehavior)
  @IsOptional()
  behavior?: StockBehavior = StockBehavior.CAPITAL_APPRECIATION;
}
