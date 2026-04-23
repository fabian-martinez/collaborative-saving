import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';

/**
 * Helper to calculate priorities for disbursements according to ADR-0006
 */
export class DisbursementPriorityHelper {
  /**
   * Calculates the priority of an item according to ADR-0006
   * 1: Old Debt with Members (Withdrawals/Dividends from previous meetings)
   * 2: Old Loan Debt (Previous loan disbursements)
   * 3: Current Period Dividends
   * 4: New Loans
   * 5: New Stock Withdrawals
   * 6: Others
   */
  static getPriority(
    item: DisbursementPlanItemDto,
    meetingId: string,
    payment?: PendingMemberPayment,
  ): number {
    // Priority 4: New Loans
    if (item.newLoanRequest) {
      return 4;
    }

    // Priority 5: New Stock Withdrawals (without previous pending payment)
    if (item.disbursementStockRequest && !item.pendingMemberPaymentId) {
      return 5;
    }

    // If it has an associated pending payment
    if (payment) {
      // Priority 2: Old Loan Debt
      if (payment.type === PendingMemberPaymentType.LOAN) {
        return 2;
      }

      // Priority 3: Current Period Dividends
      if (
        payment.type === PendingMemberPaymentType.DIVIDEND &&
        (payment.referenceMeetingId === meetingId ||
          payment.meetingId === meetingId)
      ) {
        return 3;
      }

      // Priority 1: Old Debt with Members (Old withdrawals or dividends)
      // Any other pending payment that is not a loan or current dividend falls here
      return 1;
    }

    // Priority 2 Fallback: Old loan disbursements (if they come without pendingMemberPaymentId)
    if (item.type === DisbursementType.LOAN && !item.newLoanRequest) {
      return 2;
    }

    // Priority 6: Other disbursements
    return 6;
  }
}
