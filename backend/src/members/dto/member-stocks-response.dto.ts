import { ApiProperty } from '@nestjs/swagger';

export class MemberStockDto {
  @ApiProperty({
    description: 'The unique identifier for the stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the stock',
    example: 'Acción A',
  })
  name: string;

  @ApiProperty({
    description: 'The quantity of stocks owned by the member',
    example: 10,
  })
  quantity: number;

  @ApiProperty({
    description: 'The estimated value of the stocks',
    example: 1000.0,
  })
  value: number;

  @ApiProperty({
    description: 'The nominal value of the stock',
    example: 100.0,
  })
  nominalValue: number;

  @ApiProperty({
    description: 'The required monthly contribution for this stock',
    example: 25.0,
  })
  requiredContribution: number;
}

export class MemberStocksResponseDto {
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
    description: 'List of stocks owned by the member',
    type: [MemberStockDto],
  })
  stocks: MemberStockDto[];

  @ApiProperty({
    description: 'Total estimated value of all stocks',
    example: 5000.0,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Total monthly contribution required',
    example: 125.0,
  })
  totalMonthlyContribution: number;
}
