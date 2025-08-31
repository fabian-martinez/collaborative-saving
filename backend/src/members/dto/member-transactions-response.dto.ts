import { ApiProperty } from '@nestjs/swagger';

export class MemberTransactionDto {
  @ApiProperty({
    description: 'The unique identifier for the transaction',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The date of the transaction',
    example: '2024-01-15T10:30:00Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Description of the transaction',
    example: 'Pago de cuota de préstamo',
  })
  description: string;

  @ApiProperty({
    description: 'The type of operation',
    example: 'LOAN_PAYMENT',
  })
  operationType: string;

  @ApiProperty({
    description: 'The account type affected',
    example: 'cash',
  })
  accountType: string;

  @ApiProperty({
    description: 'Related stock ID (if applicable)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  stockId?: string;

  @ApiProperty({
    description: 'Related loan ID (if applicable)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  loanId?: string;
}

export class MemberTransactionsResponseDto {
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
    description: 'List of transactions',
    type: [MemberTransactionDto],
  })
  transactions: MemberTransactionDto[];

  @ApiProperty({
    description: 'Total number of transactions',
    example: 25,
  })
  totalTransactions: number;
}
