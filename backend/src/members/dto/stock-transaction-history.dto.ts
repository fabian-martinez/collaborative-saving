import { ApiProperty } from '@nestjs/swagger';

export class StockTransactionDto {
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
    description: 'The period of the transaction (e.g., "2023-04")',
    example: '2023-04',
  })
  period: string;

  @ApiProperty({
    description: 'Description of the transaction',
    example: 'Aporte mensual acción A',
  })
  description: string;

  @ApiProperty({
    description: 'The amount of the transaction',
    example: 25.0,
  })
  amount: number;

  @ApiProperty({
    description: 'The status of the transaction',
    example: 'paid',
    enum: ['paid', 'pending', 'overdue'],
  })
  status: string;

  @ApiProperty({
    description: 'The type of operation',
    example: 'STOCK_CONTRIBUTION',
  })
  operationType: string;
}

export class StockTransactionHistoryDto {
  @ApiProperty({
    description: 'The stock ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  stockId: string;

  @ApiProperty({
    description: 'The stock name',
    example: 'Acción A',
  })
  stockName: string;

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
    description: 'The nominal value of the stock',
    example: 100.0,
    required: false,
  })
  nominalValue?: number;

  @ApiProperty({
    description: 'The required monthly contribution',
    example: 25.0,
    required: false,
  })
  requiredContribution?: number;

  @ApiProperty({
    description: 'List of transactions',
    type: [StockTransactionDto],
  })
  transactions: StockTransactionDto[];

  @ApiProperty({
    description: 'Total amount of all transactions',
    example: 300.0,
  })
  totalAmount: number;
}
