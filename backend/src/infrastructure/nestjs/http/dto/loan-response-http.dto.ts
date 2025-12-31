import { ApiProperty } from '@nestjs/swagger';

export class LoanResponseHttpDto {
  @ApiProperty({
    description: 'The unique identifier of the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The unique identifier of the member who owns the loan',
    example: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
  })
  member_id: string;

  @ApiProperty({
    description: 'The type of loan',
    example: 'corriente',
    enum: ['corriente', 'agil', 'accion'],
  })
  loan_type: string;

  @ApiProperty({
    description: 'The approved amount for the loan',
    example: 1000000,
  })
  approved_amount: number;

  @ApiProperty({
    description: 'The amount that has been disbursed',
    example: 1000000,
  })
  disbursed_amount: number;

  @ApiProperty({
    description: 'The current outstanding balance',
    example: 850000,
  })
  outstanding_balance: number;

  @ApiProperty({
    description: 'The monthly payment amount',
    example: 150000,
  })
  monthly_payment_amount: number;

  @ApiProperty({
    description: 'The interest rate (between 0 and 1)',
    example: 0.05,
  })
  interest_rate: number;

  @ApiProperty({
    description: 'The loan term in months',
    example: 12,
  })
  term: number;

  @ApiProperty({
    description: 'The current status of the loan',
    example: 'active',
    enum: ['pending', 'active', 'paid', 'defaulted', 'closed'],
  })
  status: string;

  @ApiProperty({
    description: 'The date when the loan was created',
    example: '2024-01-15T10:30:00Z',
  })
  creation_date: Date;

  @ApiProperty({
    description: 'The ID of the stock used as guarantee (if any)',
    example: 'c2ggde1b-1e2d-6gh0-dd8f-8dd1df502f33',
    required: false,
    nullable: true,
  })
  guaranteed_stock_id?: string | null;
}
