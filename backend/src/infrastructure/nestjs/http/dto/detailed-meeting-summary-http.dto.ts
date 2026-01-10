import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingInfoHttpDto {
  @ApiProperty({
    description: 'Meeting ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Meeting date',
    example: '2024-01-15T10:30:00Z',
  })
  date: string;

  @ApiProperty({
    description: 'Meeting status',
    enum: ['active', 'closed'],
    example: 'closed',
  })
  status: 'active' | 'closed';

  @ApiPropertyOptional({
    description: 'Meeting notes',
    example: 'Reunión mensual de enero',
    nullable: true,
  })
  notes: string | null;
}

export class SummaryInfoHttpDto {
  @ApiProperty({
    description: 'Total collected (cash in)',
    example: 150000.0,
  })
  total_collected: number;

  @ApiProperty({
    description: 'Total disbursed (cash out)',
    example: 30000.0,
  })
  total_disbursed: number;

  @ApiProperty({
    description: 'Share value',
    example: 1500.0,
  })
  share_value: number;

  @ApiProperty({
    description: 'Number of participants',
    example: 15,
  })
  participants: number;
}

export class CollectionItemHttpDto {
  @ApiProperty({
    description: 'Number of operations',
    example: 10,
  })
  count: number;

  @ApiProperty({
    description: 'Total amount',
    example: 50000.0,
  })
  amount: number;
}

export class CollectionsHttpDto {
  @ApiProperty({
    description: 'Member contributions',
    type: CollectionItemHttpDto,
  })
  member_contributions: CollectionItemHttpDto;

  @ApiProperty({
    description: 'Loan payments',
    type: CollectionItemHttpDto,
  })
  loan_payments: CollectionItemHttpDto;

  @ApiProperty({
    description: 'Interest collected',
    example: 5000.0,
  })
  interest_collected: number;

  @ApiProperty({
    description: 'Fees collected',
    example: 1000.0,
  })
  fees_collected: number;
}

export class DisbursementsHttpDto {
  @ApiProperty({
    description: 'New loans disbursed',
    type: CollectionItemHttpDto,
  })
  new_loans: CollectionItemHttpDto;

  @ApiProperty({
    description: 'Stock liquidations',
    type: CollectionItemHttpDto,
  })
  stock_liquidations: CollectionItemHttpDto;

  @ApiProperty({
    description: 'Dividend payments',
    type: CollectionItemHttpDto,
  })
  dividend_payments: CollectionItemHttpDto;
}

export class AttendanceMetricHttpDto {
  @ApiProperty({
    description: 'Current attendance count',
    example: 12,
  })
  current: number;

  @ApiPropertyOptional({
    description: 'Expected attendance count',
    example: 15,
  })
  expected?: number;

  @ApiProperty({
    description: 'Attendance percentage',
    example: 80.0,
  })
  percentage: number;
}

export class RevaluationMetricHttpDto {
  @ApiProperty({
    description: 'Previous stock value',
    example: 1000.0,
  })
  previous_value: number;

  @ApiProperty({
    description: 'New stock value',
    example: 1080.0,
  })
  new_value: number;

  @ApiProperty({
    description: 'Percentage change',
    example: 8.0,
  })
  percentage: number;
}

export class MetricsHttpDto {
  @ApiProperty({
    description: 'Attendance information',
    type: AttendanceMetricHttpDto,
  })
  attendance: AttendanceMetricHttpDto;

  @ApiPropertyOptional({
    description: 'Revaluation information',
    type: RevaluationMetricHttpDto,
    nullable: true,
  })
  revaluation: RevaluationMetricHttpDto | null;

  @ApiProperty({
    description: 'Number of payments up to date',
    example: 8,
  })
  payments_up_to_date: number;

  @ApiProperty({
    description: 'Number of overdue payments',
    example: 2,
  })
  overdue_payments: number;
}

export class DetailedMeetingSummaryHttpDto {
  @ApiProperty({
    description: 'Meeting information',
    type: MeetingInfoHttpDto,
  })
  meeting: MeetingInfoHttpDto;

  @ApiProperty({
    description: 'Summary information',
    type: SummaryInfoHttpDto,
  })
  summary: SummaryInfoHttpDto;

  @ApiProperty({
    description: 'Collections breakdown',
    type: CollectionsHttpDto,
  })
  collections: CollectionsHttpDto;

  @ApiProperty({
    description: 'Disbursements breakdown',
    type: DisbursementsHttpDto,
  })
  disbursements: DisbursementsHttpDto;

  @ApiProperty({
    description: 'Metrics and KPIs',
    type: MetricsHttpDto,
  })
  metrics: MetricsHttpDto;
}
