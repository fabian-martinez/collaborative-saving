import { PaymentScheduleItemDto } from './payment-schedule-item.dto';

/**
 * Payment Schedule Response DTO
 *
 * Complete payment schedule for a member including historical and projected payments
 */
export class PaymentScheduleResponseDto {
  memberId: string;
  historicalPayments: PaymentScheduleItemDto[];
  projectedPayments: PaymentScheduleItemDto[];
  summary: {
    totalPaid: number;
    totalPending: number;
    nextPaymentDate?: Date | string;
    nextPaymentAmount: number;
    totalOutstandingBalance: number;
  };
}
