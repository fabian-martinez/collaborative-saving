import { PaymentFilterType } from '@domain/enums/payment-filter-type.enum';

/**
 * Get Member Payments Query DTO
 *
 * Query parameters for retrieving member payments.
 */
export class GetMemberPaymentsQueryDto {
  paymentType?: PaymentFilterType;
  meetingId?: string;
}
