export interface StockLoanPaymentDto {
  memberId: string;
  meetingId?: string;
  subscriptionId: string;
  quantity: number;
  loanId: string;
  notes?: string;
}
