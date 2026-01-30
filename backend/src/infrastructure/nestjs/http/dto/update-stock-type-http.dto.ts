import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
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
}
