import { IsOptional, IsUUID, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { OperationType } from '@domain/enums/operation-type.enum';

export class GetOperationsQueryDto {
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsUUID()
  meetingId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType;

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

