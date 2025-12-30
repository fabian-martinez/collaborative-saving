import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { OperationType } from '../../domain/enums/operation-type.enum';

export class FindOperationsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de reunión',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  meetingId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de miembro',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de operación',
    enum: OperationType,
  })
  @IsOptional()
  @IsEnum(OperationType)
  operationType?: OperationType;

  @ApiPropertyOptional({
    description: 'Fecha desde (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Resultados por página',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
