import { PaymentType } from '@domain/enums/payment-type.enum';
import { MemberPaymentEntryDto } from './member-payment-entry.dto';

/**
 * Member Payment Response DTO
 *
 * DTO for a payment made by a member, including all its ledger entries.
 */
export class MemberPaymentResponseDto {
  operationId: string;
  type: PaymentType;
  totalAmount: number;
  description?: string;
  date: Date | string;
  meetingId: string;
  entries: MemberPaymentEntryDto[];
}
