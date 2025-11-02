import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MemberDueType {
  MANDATORY_CONTRIBUTION = 'mandatory_contribution',
  STOCK_FEE = 'stock_fee',
  LOAN_PAYMENT = 'loan_payment',
  FEE = 'fee',
  INSURANCE = 'insurance',
  NOVELTY = 'novelty',
}

export class MemberDueDetailsDto {
  @ApiProperty({
    description: 'Interest amount for loan payments',
    example: 50.0,
  })
  interest: number;

  @ApiProperty({
    description: 'Principal amount for loan payments',
    example: 100.0,
  })
  principal: number;

  @ApiProperty({
    description: 'Outstanding balance for loan payments',
    example: 1000.0,
  })
  outstanding_balance: number;
}

export class MemberDueResponseDto {
  @ApiProperty({
    description: 'Type of due/obligation',
    enum: MemberDueType,
    example: MemberDueType.LOAN_PAYMENT,
  })
  type: MemberDueType;

  @ApiProperty({
    description: 'Description of the due/obligation',
    example: 'Cuota préstamo: agil',
  })
  description: string;

  @ApiProperty({
    description: 'Amount of the due/obligation',
    example: 150.0,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Reference ID for the due (loan ID, stock ID, etc.)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Additional details for loan payments',
    type: MemberDueDetailsDto,
  })
  details?: MemberDueDetailsDto;

  @ApiPropertyOptional({
    description: 'Monthly contribution amount for stock fees',
    example: 50.0,
  })
  monthlyContribution?: number;

  @ApiPropertyOptional({
    description: 'Stock quantity for stock fees',
    example: 10,
  })
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Comment for novelty dues',
    example: 'Pago extraordinario',
  })
  noveltyComment?: string;

  @ApiPropertyOptional({
    description: 'Creation date of the due',
    example: '2024-01-15',
  })
  creationDate?: string;
}
