import { PendingMemberPaymentMapper } from './pending-member-payment.mapper';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPayment as PendingMemberPaymentEntity } from '../entities/pending-member-payment.entity';

describe('PendingMemberPaymentMapper', () => {
  describe('toDomain', () => {
    it('should map PendingMemberPaymentEntity to Domain', () => {
      const entity: Partial<PendingMemberPaymentEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: 'dividend',
        amount: 1000,
        status: 'pending',
        notes: 'First quarter',
        stockId: 'stock-1',
        loanId: null,
        stockSubscriptionId: null,
        referenceMeetingId: null,
        disbursementType: null,
        createdAt: new Date('2024-01-15'),
      };

      const domain = PendingMemberPaymentMapper.toDomain(
        entity as PendingMemberPaymentEntity,
      );

      expect(domain).toBeInstanceOf(PendingMemberPayment);
      expect(domain.id).toBe(entity.id);
      expect(domain.memberId).toBe('member-1');
      expect(domain.amount).toBe(1000);
    });
  });

  describe('toPersistence', () => {
    it('should map Domain to PendingMemberPaymentEntity', () => {
      const domain = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
        notes: 'First quarter',
      });

      const persistence = PendingMemberPaymentMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.memberId).toBe(domain.memberId);
      expect(persistence.amount).toBe(1000);
    });
  });
});
