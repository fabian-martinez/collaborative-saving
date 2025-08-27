import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';

export const MEETING_SUMMARY_FIELDS = [
  'totalCash',
  'totalInterest',
  'totalLoans',
  'totalCollected',
  'totalDividends',
  'totalStockInvestment',
  'finalCashBalance',
  'totalDisbursed',
  'participantsCount',
  'duration',
] as const;

export type MeetingSummaryField = (typeof MEETING_SUMMARY_FIELDS)[number];

export class MeetingSummaryFieldsDto {
  @ApiPropertyOptional({
    description: 'Campos de resumen a calcular (separados por coma)',
    isArray: true,
    enum: MEETING_SUMMARY_FIELDS,
    example: ['totalCash', 'totalInterest'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: MeetingSummaryField[];
}
