export interface PortfolioByLoanTypeDto {
  loanType: string;
  name: string;
  count: number;
  totalAmount: number;
}

export class GetPortfolioStatusResponseDto {
  upToDate: number;
  overdue: number;
  writtenOff: number;
  byType: PortfolioByLoanTypeDto[];
}
