export interface RecordMonthlyPaymentsResponseDto {
  operationId: string;
  meetingId: string;
  memberId: string;
  totalAmount: number;
  ledgerEntryIds: string[];
}
