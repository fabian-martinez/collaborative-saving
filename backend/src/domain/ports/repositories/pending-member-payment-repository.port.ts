import { PendingMemberPayment } from '../../entities/pending-member-payment.entity';

export interface PendingMemberPaymentRepository {
  findById(id: string): Promise<PendingMemberPayment | null>;
  findByMember(memberId: string): Promise<PendingMemberPayment[]>;
  findByMeeting(meetingId: string): Promise<PendingMemberPayment[]>;
  findPendingByMeeting(meetingId: string): Promise<PendingMemberPayment[]>;
  findByReference(referenceMeetingId: string): Promise<PendingMemberPayment[]>;
  findWithFilters(filters: {
    status?: string;
    memberId?: string;
    meetingId?: string;
    type?: string;
  }): Promise<PendingMemberPayment[]>;
  save(payment: PendingMemberPayment): Promise<PendingMemberPayment>;
  saveMany(payments: PendingMemberPayment[]): Promise<PendingMemberPayment[]>;
  calculateRemainingAmount(paymentId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
