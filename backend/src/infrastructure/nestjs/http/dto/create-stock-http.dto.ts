import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { StockBehavior } from '@domain/entities/stock.entity';

export class CreateStockHttpDto {
  @ApiProperty({
    description: 'The type or name of the stock',
    example: 'Acciones Ordinarias',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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
    description: 'Flag to indicate if the stock has a guaranteed yield',
    example: true,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_guaranteed?: boolean;

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
  guaranteed_yield?: number | null;

  @IsOptional()
  stockTypeId?: string;

  @ApiProperty({
    description: 'The creation date of the stock (optional)',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  created_at?: string;
}
