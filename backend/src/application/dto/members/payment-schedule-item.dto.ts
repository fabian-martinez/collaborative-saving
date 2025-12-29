/**
 * Payment Schedule Item DTO
 *
 * Represents a single payment item in the schedule (historical or projected)
 */
export class PaymentScheduleItemDto {
  date: Date | string;
  type: 'historical' | 'projected';
  loanId?: string;
  loanType?: string;
  totalAmount: number;
  interestAmount: number;
  principalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  operationId?: string; // Only for historical payments
  remainingBalance?: number; // Only for projected payments
  paymentNumber?: number; // Payment number in sequence
}
