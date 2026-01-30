import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { CreateStockHttpDto } from './create-stock-http.dto';
// import { StockBehavior } from '@domain/entities/stock.entity'; // Removed as 'behavior' property is removed

export class UpdateStockHttpDto extends PartialType(CreateStockHttpDto) {
  @ApiProperty({
    description: 'The type or name of the stock',
    example: 'Acciones Preferenciales', // Updated example
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string; // Renamed from 'type'

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
  monthly_contribution?: number;

  @ApiProperty({
    description: 'Flag to indicate if the stock has a guaranteed yield',
    example: true,
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

  @ApiProperty({
    description: 'The ID of the stock type associated with this stock', // New description for stockTypeId
    example: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  stockTypeId?: string; // New property
}
