export class PendingMemberPaymentResponseDto {
  id: string;
  memberId: string;
  meetingId: string;
  type: string;
  amount: number;
  status: string;
  notes?: string | null;
  createdAt: Date;
  referenceMeetingId?: string | null;
  stockId?: string | null;
  loanId?: string | null;
  stockSubscriptionId?: string | null;
  disbursementType?: string | null;
  // We can include relations if needed in the frontend
  memberName?: string;
  firstName?: string;
  lastName?: string;
}
