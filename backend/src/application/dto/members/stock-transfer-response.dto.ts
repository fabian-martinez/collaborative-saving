/**
 * Stock Transfer Response DTO
 *
 * DTO for a stock transfer operation made by a member.
 */
export class StockTransferResponseDto {
  operationId: string;
  meetingId: string;
  date: Date | string;
  description: string;
  stockId: string;
  stockType: string;
  quantity: number;
  value: number;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  fromSubscriptionId: string;
  toSubscriptionId: string;
}
