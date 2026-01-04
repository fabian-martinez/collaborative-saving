import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, ALL_ACCOUNT_TYPES } from '@domain/constants/account-types';

export class GetAccountsSummaryQueryHttpDto {
  @ApiPropertyOptional({
    description: 'Maximum number of entries to return per account (for display purposes only, totals are calculated with all entries)',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  entries_limit?: number;

  @ApiPropertyOptional({
    description: 'Filter entries by start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter entries by end date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific account types',
    enum: ALL_ACCOUNT_TYPES,
    isArray: true,
    example: ['CASH', 'STOCK_CAPITAL'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ALL_ACCOUNT_TYPES, { each: true })
  account_types?: AccountType[];

  @ApiPropertyOptional({
    description: 'Include accounts with zero balance',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  include_zero_balance?: boolean;
}

