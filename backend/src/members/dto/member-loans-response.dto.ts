import { ApiProperty } from '@nestjs/swagger';

export class MemberLoanDto {
  @ApiProperty({
    description: 'The unique identifier for the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The type of loan',
    example: 'corriente',
  })
  loanType: string;

  @ApiProperty({
    description: 'The total amount approved for the loan',
    example: 5000.0,
  })
  approvedAmount: number;

  @ApiProperty({
    description: 'The fixed monthly payment amount for the loan',
    example: 250.0,
  })
  monthlyPaymentAmount: number;

  @ApiProperty({
    description: 'The remaining balance to be paid',
    example: 2500.0,
  })
  outstandingBalance: number;

  @ApiProperty({
    description: 'The interest rate for the loan',
    example: 0.02,
  })
  interestRate: number;

  @ApiProperty({
    description: 'The term of the loan in months',
    example: 24,
  })
  term: number;

  @ApiProperty({
    description: 'The current status of the loan',
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'The date the loan was created',
    example: '2023-12-01',
  })
  creationDate: string;
}

export class MemberLoansResponseDto {
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
    description: 'List of loans for the member',
    type: [MemberLoanDto],
  })
  loans: MemberLoanDto[];

  @ApiProperty({
    description: 'Total approved amount for all loans',
    example: 15000.0,
  })
  totalApprovedAmount: number;

  @ApiProperty({
    description: 'Total outstanding balance for all loans',
    example: 7500.0,
  })
  totalOutstandingBalance: number;

  @ApiProperty({
    description: 'Total monthly payment amount for all loans',
    example: 750.0,
  })
  totalMonthlyPayment: number;
}
