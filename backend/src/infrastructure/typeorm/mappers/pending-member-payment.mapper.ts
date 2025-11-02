import { PendingMemberPayment as PendingMemberPaymentDomain } from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPayment as PendingMemberPaymentEntity } from '../entities/pending-member-payment.entity';

export class PendingMemberPaymentMapper {
  static toDomain(
    persistence: PendingMemberPaymentEntity,
  ): PendingMemberPaymentDomain {
    try {
      return PendingMemberPaymentDomain.fromPersistence({
        id: persistence.id,
        member_id: persistence.memberId,
        meeting_id: persistence.meetingId,
        type: persistence.type,
        amount: persistence.amount,
        status: persistence.status,
        created_at: persistence.createdAt,
        notes: persistence.notes ?? null,
        stock_id: persistence.stockId ?? null,
        loan_id: persistence.loanId ?? null,
        stock_subscription_id: persistence.stockSubscriptionId ?? null,
        reference_meeting_id: persistence.referenceMeetingId ?? null,
        disbursement_type: persistence.disbursementType ?? null,
      });
    } catch (error) {
      throw new Error(
        `Failed to map PendingMemberPayment to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(
    domain: PendingMemberPaymentDomain,
  ): Partial<PendingMemberPaymentEntity> {
    return {
      id: domain.id,
      memberId: domain.memberId,
      meetingId: domain.meetingId,
      type: domain.type,
      amount: domain.amount,
      status: domain.status,
      notes: domain.notes ?? null,
      stockId: domain.stockId ?? null,
      loanId: domain.loanId ?? null,
      stockSubscriptionId: domain.stockSubscriptionId ?? null,
      referenceMeetingId: domain.referenceMeetingId ?? null,
      disbursementType: domain.disbursementType ?? null,
    };
  }
}
