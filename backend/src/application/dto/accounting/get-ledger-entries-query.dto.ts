import { IsOptional, IsUUID, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { AccountType, ALL_ACCOUNT_TYPES } from '@domain/constants/account-types';

export class GetLedgerEntriesQueryDto {
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsEnum(ALL_ACCOUNT_TYPES)
  accountType?: AccountType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderBy?: 'ASC' | 'DESC' = 'DESC';
}

