export interface StockExchangeDto {
  memberId: string;
  meetingId?: string;
  fromSubscriptionId: string;
  fromQuantity: number;
  toStockId: string;
  toQuantity: number;
  differenceHandling?: 'cash' | 'credit';
  targetLoanId?: string;
  notes?: string;
}
