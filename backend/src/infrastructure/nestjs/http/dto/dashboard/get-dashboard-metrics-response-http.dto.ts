import { ApiProperty } from '@nestjs/swagger';

export class ActiveMembersHttpDto {
  @ApiProperty({ description: 'Number of active members', example: 42 })
  count: number;

  @ApiProperty({ description: 'Total number of members', example: 45 })
  total: number;

  @ApiProperty({ description: 'Percentage change in active members', example: 5 })
  change_percent: number;
}

export class TotalStocksHttpDto {
  @ApiProperty({ description: 'Count of total stocks', example: 328 })
  count: number;

  @ApiProperty({ description: 'Total value of stocks', example: 16400000 })
  value: number;

  @ApiProperty({ description: 'Percentage change in total stocks', example: 8 })
  change_percent: number;
}

export class ActiveLoansHttpDto {
  @ApiProperty({ description: 'Count of active loans', example: 18 })
  count: number;

  @ApiProperty({ description: 'Indicates if loans exist in portfolio', example: true })
  in_portfolio: boolean;
}

export class TotalPortfolioHttpDto {
  @ApiProperty({ description: 'Total value of portfolio', example: 24500000 })
  value: number;
}

export class OverduePortfolioHttpDto {
  @ApiProperty({ description: 'Value of overdue portfolio', example: 1250000 })
  value: number;

  @ApiProperty({ description: 'Percentage of overdue portfolio relative to total portfolio', example: 5.1 })
  percent_of_total: number;
}

export class MonthlyCollectedHttpDto {
  @ApiProperty({ description: 'Value collected monthly', example: 8750000 })
  value: number;

  @ApiProperty({ description: 'Percentage change in monthly collection', example: 12 })
  change_percent: number;
}

export class GetDashboardMetricsResponseHttpDto {
  @ApiProperty({ type: ActiveMembersHttpDto })
  active_members: ActiveMembersHttpDto;

  @ApiProperty({ type: TotalStocksHttpDto })
  total_stocks: TotalStocksHttpDto;

  @ApiProperty({ type: ActiveLoansHttpDto })
  active_loans: ActiveLoansHttpDto;

  @ApiProperty({ type: TotalPortfolioHttpDto })
  total_portfolio: TotalPortfolioHttpDto;

  @ApiProperty({ type: OverduePortfolioHttpDto })
  overdue_portfolio: OverduePortfolioHttpDto;

  @ApiProperty({ type: MonthlyCollectedHttpDto })
  monthly_collected: MonthlyCollectedHttpDto;
}
