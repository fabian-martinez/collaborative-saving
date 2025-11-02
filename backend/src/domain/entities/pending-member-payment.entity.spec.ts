import {
  PendingMemberPayment,
  PendingMemberPaymentType,
  PendingMemberPaymentStatus,
} from './pending-member-payment.entity';

describe('PendingMemberPayment Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create PendingMemberPayment with required fields', () => {
      const payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      expect(payment.id).toBeDefined();
      expect(payment.memberId).toBe('member-1');
      expect(payment.meetingId).toBe('meeting-1');
      expect(payment.type).toBe('dividend');
      expect(payment.amount).toBe(1000);
      expect(payment.status).toBe('pending');
      expect(payment.createdAt).toBeInstanceOf(Date);
    });

    it('should accept optional notes', () => {
      const payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
        notes: 'First quarter dividend',
      });

      expect(payment.notes).toBe('First quarter dividend');
    });

    it('should accept optional entity references', () => {
      const payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: 500,
        stockId: 'stock-1',
        loanId: 'loan-1',
        stockSubscriptionId: 'subscription-1',
      });

      expect(payment.stockId).toBe('stock-1');
      expect(payment.loanId).toBe('loan-1');
      expect(payment.stockSubscriptionId).toBe('subscription-1');
    });

    it('should generate unique IDs for each payment', () => {
      const p1 = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });
      const p2 = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      expect(p1.id).not.toBe(p2.id);
    });

    it('should throw error for invalid amount', () => {
      expect(() =>
        PendingMemberPayment.create({
          memberId: 'member-1',
          meetingId: 'meeting-1',
          type: PendingMemberPaymentType.DIVIDEND,
          amount: 0,
        }),
      ).toThrow('PendingMemberPayment amount must be > 0');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create PendingMemberPayment from persistence data', () => {
      const payment = PendingMemberPayment.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: 'dividend',
        amount: 1000,
        status: 'pending',
        created_at: mockDate,
      });

      expect(payment.id).toBe(mockId);
      expect(payment.memberId).toBe('member-1');
      expect(payment.meetingId).toBe('meeting-1');
      expect(payment.type).toBe('dividend');
      expect(payment.amount).toBe(1000);
      expect(payment.status).toBe('pending');
    });

    it('should handle string dates', () => {
      const payment = PendingMemberPayment.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: 'dividend',
        amount: 1000,
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
      });

      expect(payment.createdAt).toBeInstanceOf(Date);
    });

    it('should handle string amount', () => {
      const payment = PendingMemberPayment.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: 'dividend',
        amount: '1000.50',
        status: 'pending',
        created_at: mockDate,
      });

      expect(payment.amount).toBe(1000.5);
    });

    it('should handle nullable optional fields', () => {
      const payment = PendingMemberPayment.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: 'dividend',
        amount: 1000,
        status: 'pending',
        created_at: mockDate,
        notes: null,
        stock_id: null,
        loan_id: null,
        stock_subscription_id: null,
        reference_meeting_id: null,
        disbursement_type: null,
      });

      expect(payment.notes).toBeUndefined();
      expect(payment.stockId).toBeUndefined();
      expect(payment.loanId).toBeUndefined();
    });
  });

  describe('update method', () => {
    let payment: PendingMemberPayment;

    beforeEach(() => {
      payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });
    });

    it('should update amount', () => {
      payment.update({ amount: 1500 });
      expect(payment.amount).toBe(1500);
    });

    it('should update status', () => {
      payment.update({ status: PendingMemberPaymentStatus.APPROVED });
      expect(payment.status).toBe('approved');
    });

    it('should update notes', () => {
      payment.update({ notes: 'Updated notes' });
      expect(payment.notes).toBe('Updated notes');
    });

    it('should throw error for invalid amount', () => {
      expect(() => payment.update({ amount: 0 })).toThrow(
        'PendingMemberPayment amount must be > 0',
      );
    });
  });

  describe('approve method', () => {
    let payment: PendingMemberPayment;

    beforeEach(() => {
      payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });
    });

    it('should approve pending payment', () => {
      payment.approve();
      expect(payment.status).toBe('approved');
    });

    it('should throw error when trying to approve non-pending payment', () => {
      payment.approve();
      expect(() => payment.approve()).toThrow(
        'Can only approve pending payments',
      );
    });
  });

  describe('reject method', () => {
    let payment: PendingMemberPayment;

    beforeEach(() => {
      payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });
    });

    it('should reject pending payment', () => {
      payment.reject();
      expect(payment.status).toBe('rejected');
    });

    it('should throw error when trying to reject non-pending payment', () => {
      payment.approve();
      expect(() => payment.reject()).toThrow(
        'Can only reject pending payments',
      );
    });
  });

  describe('markAsPaid method', () => {
    let payment: PendingMemberPayment;

    beforeEach(() => {
      payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });
    });

    it('should mark approved payment as paid', () => {
      payment.approve();
      payment.markAsPaid();
      expect(payment.status).toBe('paid');
    });

    it('should throw error when trying to mark non-approved payment as paid', () => {
      expect(() => payment.markAsPaid()).toThrow(
        'Can only mark approved payments as paid',
      );
    });
  });

  describe('isPending method', () => {
    it('should return true for pending payment', () => {
      const payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });
      expect(payment.isPending()).toBe(true);
    });

    it('should return false for approved payment', () => {
      const payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });
      payment.approve();
      expect(payment.isPending()).toBe(false);
    });
  });

  describe('getters', () => {
    let payment: PendingMemberPayment;

    beforeEach(() => {
      payment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
        notes: 'Test notes',
        stockId: 'stock-1',
      });
    });

    it('should return memberId via getter', () => {
      expect(payment.memberId).toBe('member-1');
    });

    it('should return meetingId via getter', () => {
      expect(payment.meetingId).toBe('meeting-1');
    });

    it('should return type via getter', () => {
      expect(payment.type).toBe('dividend');
    });

    it('should return amount via getter', () => {
      expect(payment.amount).toBe(1000);
    });

    it('should return status via getter', () => {
      expect(payment.status).toBe('pending');
    });

    it('should return notes via getter', () => {
      expect(payment.notes).toBe('Test notes');
    });

    it('should return stockId via getter', () => {
      expect(payment.stockId).toBe('stock-1');
    });
  });
});
