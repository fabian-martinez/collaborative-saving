/**
 * Stock Subscription Response DTO
 *
 * DTO for a stock subscription owned by a member.
 */
export class StockSubscriptionResponseDto {
  id: string;
  stockId: string;
  stockName: string;
  quantity: number;
  purchaseDate: Date | string;
  status: string;
  financingLoanId?: string | null;
}
