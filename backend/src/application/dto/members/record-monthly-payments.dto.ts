import { PaymentItemDto } from './payment-item.dto';

/**
 * Record Monthly Payments DTO
 *
 * Input DTO for recording monthly payments from a member.
 * Contains the member ID, array of payments, and optional meeting ID.
 */
export interface RecordMonthlyPaymentsDto {
  memberId: string;
  payments: PaymentItemDto[];
  meetingId?: string;
}
