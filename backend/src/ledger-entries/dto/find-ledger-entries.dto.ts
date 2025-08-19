import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsUUID,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class FindLedgerEntriesDto {
  @ApiPropertyOptional({
    description: 'Búsqueda por texto en descripción o ID de operación',
    type: String,
    example: 'loan payment',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de miembro',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de cuenta',
    type: String,
    example: 'CASH',
  })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de reunión',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  meetingId?: string;

  @ApiPropertyOptional({
    description: 'Fecha desde (ISO 8601)',
    type: String,
    format: 'date-time',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (ISO 8601)',
    type: String,
    format: 'date-time',
    example: '2025-12-31T23:59:59Z',
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
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
