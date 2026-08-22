import { ApiProperty } from '@nestjs/swagger';

export class LoanTransactionResponseHttpDto {
  @ApiProperty({
    description: 'The unique identifier of the transaction',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The unique identifier of the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  loan_id: string;

  @ApiProperty({
    description: 'The type of transaction',
    example: 'principal_payment',
    enum: ['disbursement', 'principal_payment', 'interest_payment'],
  })
  transaction_type: string;

  @ApiProperty({
    description: 'The transaction amount',
    example: 200000,
  })
  amount: number;

  @ApiProperty({
    description: 'The date when the transaction occurred',
    example: '2024-01-15T10:30:00Z',
  })
  transaction_date: Date;

  @ApiProperty({
    description: 'Optional notes for the transaction',
    example: 'Cash payment during meeting',
    required: false,
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    description: 'The operation ID associated with the ledger entry',
    example: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
    required: false,
    nullable: true,
  })
  operation_id?: string | null;
}
