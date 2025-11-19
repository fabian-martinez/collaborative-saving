/**
 * Purchase Stock Response DTO
 *
 * Output DTO returned after successfully purchasing stocks.
 * Contains operation ID, meeting ID, member ID, stock subscription ID, and optional loan ID.
 */
export interface PurchaseStockResponseDto {
  operationId: string;
  meetingId: string;
  memberId: string;
  stockSubscriptionId: string;
  loanId?: string | null;
}
