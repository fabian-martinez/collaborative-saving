import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OperationType } from '@domain/enums/operation-type.enum';

export class GetOperationsQueryHttpDto {
  @ApiPropertyOptional({
    description: 'Filter by member ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'Filter by meeting ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meetingId?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by operation type',
    enum: OperationType,
    example: OperationType.MONTHLY_PAYMENT,
  })
  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType;

  @ApiPropertyOptional({
    description: 'Page number (starts at 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort order by date',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderBy?: 'ASC' | 'DESC';
}
