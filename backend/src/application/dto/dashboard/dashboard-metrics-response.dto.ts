export interface ActiveMembersDto {
  count: number;
  total: number;
  changePercent: number;
}

export interface TotalStocksDto {
  count: number;
  value: number;
  changePercent: number;
}

export interface ActiveLoansDto {
  count: number;
  inPortfolio: boolean;
}

export interface TotalPortfolioDto {
  value: number;
}

export interface OverduePortfolioDto {
  value: number;
  percentOfTotal: number;
}

export interface MonthlyCollectedDto {
  value: number;
  changePercent: number;
}

export interface GetDashboardMetricsResponseDto {
  activeMembers: ActiveMembersDto;
  totalStocks: TotalStocksDto;
  activeLoans: ActiveLoansDto;
  totalPortfolio: TotalPortfolioDto;
  overduePortfolio: OverduePortfolioDto;
  monthlyCollected: MonthlyCollectedDto;
}
