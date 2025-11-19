/**
 * Purchase Stock DTO
 *
 * Input DTO for purchasing stocks.
 * Contains member ID, stock ID, quantity, cash amount, optional loan details, and optional meeting ID.
 */
export interface LoanDetailsDto {
  interest_rate: number;
  loan_type: 'corriente' | 'agil' | 'accion';
}

export interface PurchaseStockDto {
  memberId: string;
  stockId: string;
  quantity: number;
  cashAmount: number;
  loanDetails?: LoanDetailsDto;
  meetingId?: string;
}
