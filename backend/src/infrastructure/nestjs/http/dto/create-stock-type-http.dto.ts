import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';
import { StockBehavior } from '@domain/entities/stock.entity';

export class CreateStockTypeHttpDto {
  @ApiProperty({ example: 'Acción Ordinaria' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CAPITAL_APPRECIATION', enum: StockBehavior })
  @IsEnum(StockBehavior)
  behavior: StockBehavior;
}
