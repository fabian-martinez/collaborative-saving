import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { CreateStockHttpDto } from './create-stock-http.dto';
import { StockBehavior } from '@domain/entities/stock.entity';

export class UpdateStockHttpDto extends PartialType(CreateStockHttpDto) {
  @ApiProperty({
    description: 'The type or name of the stock',
    example: 'preferential',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'The current value of one stock unit',
    example: 110.0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiProperty({
    description: 'The mandatory monthly contribution for this stock type',
    example: 50.0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyContribution?: number;

  @ApiProperty({
    description: 'Flag to indicate if the stock has a guaranteed yield',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isGuaranteed?: boolean;

  @ApiProperty({
    description:
      'The guaranteed yield for the stock, if applicable (e.g., 0.02 for 2%)',
    example: 0.02,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  guaranteedYield?: number | null;

  @ApiProperty({
    description:
      'Comportamiento de la acción: apreciación de capital o dividendos',
    enum: StockBehavior,
    required: false,
  })
  @IsEnum(StockBehavior)
  @IsOptional()
  behavior?: StockBehavior;
}
