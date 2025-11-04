/**
 * Record Monthly Payments Response DTO
 *
 * Output DTO returned after successfully recording monthly payments.
 * Contains operation details and ledger entry IDs.
 */
export interface RecordMonthlyPaymentsResponseDto {
  operationId: string;
  meetingId: string;
  memberId: string;
  totalAmount: number;
  ledgerEntryIds: string[];
}
