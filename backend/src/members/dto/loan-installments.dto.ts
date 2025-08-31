import { ApiProperty } from '@nestjs/swagger';

export class LoanInstallmentDto {
  @ApiProperty({
    description: 'The unique identifier for the installment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The installment number',
    example: 1,
  })
  installmentNumber: number;

  @ApiProperty({
    description: 'The due date of the installment',
    example: '2024-02-01',
  })
  dueDate: Date;

  @ApiProperty({
    description: 'The payment date (if paid)',
    example: '2024-02-01',
    nullable: true,
  })
  paymentDate?: Date;

  @ApiProperty({
    description: 'The principal amount of the installment',
    example: 200.0,
  })
  principal: number;

  @ApiProperty({
    description: 'The interest amount of the installment',
    example: 50.0,
  })
  interest: number;

  @ApiProperty({
    description: 'The total amount of the installment',
    example: 250.0,
  })
  total: number;

  @ApiProperty({
    description: 'The status of the installment',
    example: 'paid',
    enum: ['paid', 'pending', 'overdue'],
  })
  status: string;

  @ApiProperty({
    description: 'The amount paid (if partial payment)',
    example: 250.0,
    nullable: true,
  })
  amountPaid?: number;
}

export class LoanInstallmentsDto {
  @ApiProperty({
    description: 'The loan ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  loanId: string;

  @ApiProperty({
    description: 'The member ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  memberId: string;

  @ApiProperty({
    description: 'The member name',
    example: 'Fabian Martinez',
  })
  memberName: string;

  @ApiProperty({
    description: 'The loan amount',
    example: 5000.0,
  })
  loanAmount: number;

  @ApiProperty({
    description: 'The loan term in months',
    example: 24,
  })
  term: number;

  @ApiProperty({
    description: 'The interest rate',
    example: 0.02,
  })
  interestRate: number;

  @ApiProperty({
    description: 'List of all installments',
    type: [LoanInstallmentDto],
  })
  installments: LoanInstallmentDto[];

  @ApiProperty({
    description: 'Total amount paid',
    example: 2500.0,
  })
  totalPaid: number;

  @ApiProperty({
    description: 'Total amount pending',
    example: 2500.0,
  })
  totalPending: number;

  @ApiProperty({
    description: 'Outstanding balance',
    example: 2500.0,
  })
  outstandingBalance: number;
}
