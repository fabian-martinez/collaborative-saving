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
  @IsInt()
  @Min(1)
  @Max(100)
  entriesLimit?: number;

  @ApiPropertyOptional({
    description: 'Filter entries by start date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter entries by end date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific account types',
    enum: ALL_ACCOUNT_TYPES,
    isArray: true,
    example: ['CASH', 'STOCK_CAPITAL'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ALL_ACCOUNT_TYPES, { each: true })
  accountTypes?: AccountType[];

  @ApiPropertyOptional({
    description: 'Include accounts with zero balance',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeZeroBalance?: boolean;
}

