import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payment Schedule Item HTTP DTO
 */
export class PaymentScheduleItemHttpDto {
  @ApiProperty({
    description: 'Payment date',
    example: '2024-01-15T10:30:00Z',
  })
  date: Date | string;

  @ApiProperty({
    description: 'Type of payment (historical or projected)',
    enum: ['historical', 'projected'],
    example: 'historical',
  })
  type: 'historical' | 'projected';

  @ApiPropertyOptional({
    description: 'Loan ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  loanId?: string;

  @ApiPropertyOptional({
    description: 'Loan type',
    example: 'personal',
  })
  loanType?: string;

  @ApiProperty({
    description: 'Total payment amount',
    example: 150000,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Interest amount',
    example: 10000,
  })
  interestAmount: number;

  @ApiProperty({
    description: 'Principal amount',
    example: 140000,
  })
  principalAmount: number;

  @ApiProperty({
    description: 'Payment status',
    enum: ['paid', 'pending', 'overdue'],
    example: 'paid',
  })
  status: 'paid' | 'pending' | 'overdue';

  @ApiPropertyOptional({
    description: 'Operation ID (only for historical payments)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  operationId?: string;

  @ApiPropertyOptional({
    description: 'Remaining balance (only for projected payments)',
    example: 850000,
  })
  remainingBalance?: number;

  @ApiPropertyOptional({
    description: 'Payment number in sequence',
    example: 3,
  })
  paymentNumber?: number;
}

