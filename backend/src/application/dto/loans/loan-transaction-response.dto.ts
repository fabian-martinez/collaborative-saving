export interface LoanTransactionResponseDto {
  id: string;
  loanId: string;
  transactionType: string;
  amount: number;
  transactionDate: Date;
  notes?: string | null;
  operationId?: string | null;
}
