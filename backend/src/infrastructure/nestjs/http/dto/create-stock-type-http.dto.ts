import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { StockBehavior } from '@domain/entities/stock.entity';

export class CreateStockTypeHttpDto {
  @ApiProperty({ example: 'Acción Ordinaria' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CAPITAL_APPRECIATION', enum: StockBehavior })
  @IsEnum(StockBehavior)
  behavior: StockBehavior;

  @ApiProperty({ example: false })
  @IsBoolean()
  isGuaranteed: boolean;

  @ApiProperty({ example: null, required: false })
  @IsOptional()
  @IsNumber()
  guaranteedYield: number | null;
}
