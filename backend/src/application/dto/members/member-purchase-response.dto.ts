/**
 * Member Purchase Response DTO
 *
 * DTO for a stock purchase made by a member, including loan information if applicable.
 */
export class MemberPurchaseResponseDto {
  stockSubscriptionId: string;
  stockId: string;
  stockType: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  purchaseDate: Date | string;
  meetingId: string;
  operationId: string;
  loan?: {
    loanId: string;
    approvedAmount: number;
    interestRate: number;
    status: string;
  } | null;
}
