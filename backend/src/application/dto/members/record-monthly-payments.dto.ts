import { PaymentItemDto } from './payment-item.dto';
import { Meeting } from '@domain/entities/meeting.entity';

/**
 * Record Monthly Payments DTO
 *
 * Input DTO for recording monthly payments from a member.
 * Contains the member ID, array of payments, optional meeting ID, and optional pre-fetched active meeting entity.
 */
export interface RecordMonthlyPaymentsDto {
  memberId: string;
  payments: PaymentItemDto[];
  meetingId?: string;
  activeMeeting?: Meeting;
}
