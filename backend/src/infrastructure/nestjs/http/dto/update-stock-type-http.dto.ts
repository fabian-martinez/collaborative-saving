import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { StockBehavior } from '@domain/entities/stock.entity';

export class UpdateStockTypeHttpDto {
  @ApiPropertyOptional({ example: 'Acción Preferencial' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'DIVIDEND_YIELD', enum: StockBehavior })
  @IsOptional()
  @IsEnum(StockBehavior)
  behavior?: StockBehavior;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isGuaranteed?: boolean;

  @ApiPropertyOptional({ example: 0.1 })
  @IsOptional()
  @IsNumber()
  guaranteedYield?: number | null;
}
