/**
 * Stock Loan Payment Response DTO
 *
 * DTO for a stock loan payment operation made by a member.
 */
export class StockLoanPaymentResponseDto {
  operationId: string;
  meetingId: string;
  date: Date | string;
  description: string;
  stockId: string;
  stockName: string;
  quantity: number;
  paymentValue: number;
  loanId: string;
  loanType: string;
  previousBalance: number;
  newBalance: number;
  subscriptionId: string;
  transactionDetailId: string;
}
