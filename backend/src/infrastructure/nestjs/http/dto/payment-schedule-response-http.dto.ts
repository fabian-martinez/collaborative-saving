import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentScheduleItemHttpDto } from './payment-schedule-item-http.dto';

/**
 * Payment Schedule Summary HTTP DTO
 */
class PaymentScheduleSummaryHttpDto {
  @ApiProperty({
    description: 'Total amount paid',
    example: 500000,
  })
  total_paid: number;

  @ApiProperty({
    description: 'Total amount pending',
    example: 1200000,
  })
  total_pending: number;

  @ApiPropertyOptional({
    description: 'Next payment date',
    example: '2024-02-15T10:30:00Z',
  })
  next_payment_date?: Date | string;

  @ApiProperty({
    description: 'Next payment amount',
    example: 150000,
  })
  next_payment_amount: number;

  @ApiProperty({
    description: 'Total outstanding balance across all loans',
    example: 2000000,
  })
  total_outstanding_balance: number;
}

/**
 * Payment Schedule Response HTTP DTO
 */
export class PaymentScheduleResponseHttpDto {
  @ApiProperty({
    description: 'Member ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  member_id: string;

  @ApiProperty({
    description: 'Historical payments',
    type: [PaymentScheduleItemHttpDto],
  })
  historical_payments: PaymentScheduleItemHttpDto[];

  @ApiProperty({
    description: 'Projected payments',
    type: [PaymentScheduleItemHttpDto],
  })
  projected_payments: PaymentScheduleItemHttpDto[];

  @ApiProperty({
    description: 'Payment schedule summary',
    type: PaymentScheduleSummaryHttpDto,
  })
  summary: PaymentScheduleSummaryHttpDto;
}
