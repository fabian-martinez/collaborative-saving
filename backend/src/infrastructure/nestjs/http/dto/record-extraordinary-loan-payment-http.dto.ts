import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class RecordExtraordinaryLoanPaymentHttpDto {
  @ApiProperty({ description: 'The UUID of the loan' })
  @IsNotEmpty()
  @IsString()
  loanId!: string;

  @ApiProperty({ description: 'Amount to pay towards principal' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ description: 'The UUID of the current active meeting' })
  @IsNotEmpty()
  @IsString()
  meetingId!: string;

  @ApiProperty({
    description: 'Optional notes for the extraordinary payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Optional flag to fully liquidate the loan',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isFullPayoff?: boolean;
}
