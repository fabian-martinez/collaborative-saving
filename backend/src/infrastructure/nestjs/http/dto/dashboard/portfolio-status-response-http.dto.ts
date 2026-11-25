import { ApiProperty } from '@nestjs/swagger';

export class PortfolioByLoanTypeHttpDto {
  @ApiProperty({ description: 'Loan type code', example: 'corriente' })
  loan_type: string;

  @ApiProperty({ description: 'Loan type display name', example: 'Corriente' })
  name: string;

  @ApiProperty({ description: 'Number of active loans of this type', example: 5 })
  count: number;

  @ApiProperty({
    description: 'Total outstanding balance for this loan type',
    example: 12500000,
  })
  total_amount: number;
}

export class GetPortfolioStatusResponseHttpDto {
  @ApiProperty({
    description: 'Number of up-to-date loans',
    example: 85,
  })
  up_to_date: number;

  @ApiProperty({
    description: 'Number of overdue loans',
    example: 10,
  })
  overdue: number;

  @ApiProperty({
    description: 'Number of written-off loans',
    example: 5,
  })
  written_off: number;

  @ApiProperty({
    description: 'Active portfolio distribution by loan type',
    type: [PortfolioByLoanTypeHttpDto],
  })
  by_type: PortfolioByLoanTypeHttpDto[];
}
