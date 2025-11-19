export interface StockTransferDto {
  memberId: string;
  meetingId?: string;
  fromSubscriptionId: string;
  quantity: number;
  toMemberId: string;
  notes?: string;
}
