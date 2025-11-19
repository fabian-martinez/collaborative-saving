/**
 * Stock Exchange Response DTO
 *
 * DTO for a stock exchange operation made by a member.
 */
export class StockExchangeResponseDto {
  operationId: string;
  meetingId: string;
  date: Date | string;
  description: string;
  fromStockId: string;
  fromStockType: string;
  fromQuantity: number;
  fromValue: number;
  toStockId: string;
  toStockType: string;
  toQuantity: number;
  toValue: number;
  difference: number;
  differenceHandling?: 'cash' | 'credit';
  fromSubscriptionId: string;
  toSubscriptionId: string;
  pendingPaymentId?: string | null;
  loanId?: string | null;
}
