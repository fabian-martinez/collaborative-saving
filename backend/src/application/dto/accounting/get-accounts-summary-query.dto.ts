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
import {
  AccountType,
  ALL_ACCOUNT_TYPES,
} from '@domain/constants/account-types';

export class GetAccountsSummaryQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  entriesLimit?: number = 10;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ALL_ACCOUNT_TYPES, { each: true })
  accountTypes?: AccountType[];

  @IsOptional()
  @IsBoolean()
  includeZeroBalance?: boolean = false;
}
