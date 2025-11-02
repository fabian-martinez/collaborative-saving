import {
  StockSubscription,
  StockSubscriptionStatus,
} from './stock-subscription.entity';

describe('StockSubscription Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create StockSubscription with required fields', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      expect(subscription.id).toBeDefined();
      expect(subscription.memberId).toBe('member-1');
      expect(subscription.stockId).toBe('stock-1');
      expect(subscription.quantity).toBe(10);
      expect(subscription.status).toBe('active');
      expect(subscription.purchaseDate).toBeInstanceOf(Date);
    });

    it('should set status to inactive when quantity is 0', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 0,
      });

      expect(subscription.quantity).toBe(0);
      expect(subscription.status).toBe('inactive');
    });

    it('should set status to active when quantity > 0', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 5,
      });

      expect(subscription.status).toBe('active');
    });

    it('should accept optional purchaseDate', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        purchaseDate: mockDate,
      });

      expect(subscription.purchaseDate).toEqual(mockDate);
    });

    it('should accept optional financingLoanId', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        financingLoanId: 'loan-1',
      });

      expect(subscription.financingLoanId).toBe('loan-1');
    });

    it('should generate unique IDs for each subscription', () => {
      const sub1 = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });
      const sub2 = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      expect(sub1.id).not.toBe(sub2.id);
    });

    it('should throw error for negative quantity', () => {
      expect(() =>
        StockSubscription.create({
          memberId: 'member-1',
          stockId: 'stock-1',
          quantity: -1,
        }),
      ).toThrow('StockSubscription quantity must be >= 0');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create StockSubscription from persistence data', () => {
      const subscription = StockSubscription.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        stock_id: 'stock-1',
        quantity: 10,
        status: 'active',
        purchase_date: mockDate,
      });

      expect(subscription.id).toBe(mockId);
      expect(subscription.memberId).toBe('member-1');
      expect(subscription.stockId).toBe('stock-1');
      expect(subscription.quantity).toBe(10);
      expect(subscription.status).toBe('active');
    });

    it('should handle string dates', () => {
      const subscription = StockSubscription.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        stock_id: 'stock-1',
        quantity: 10,
        status: 'active',
        purchase_date: '2024-01-15',
      });

      expect(subscription.purchaseDate).toBeInstanceOf(Date);
    });

    it('should handle string quantity', () => {
      const subscription = StockSubscription.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        stock_id: 'stock-1',
        quantity: '10.5',
        status: 'active',
        purchase_date: mockDate,
      });

      expect(subscription.quantity).toBe(10.5);
    });

    it('should handle nullable financingLoanId', () => {
      const subscription = StockSubscription.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        stock_id: 'stock-1',
        quantity: 10,
        status: 'active',
        purchase_date: mockDate,
        financing_loan_id: null,
      });

      expect(subscription.financingLoanId).toBeUndefined();
    });
  });

  describe('update method', () => {
    let subscription: StockSubscription;

    beforeEach(() => {
      subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });
    });

    it('should update quantity', () => {
      subscription.update({ quantity: 20 });
      expect(subscription.quantity).toBe(20);
    });

    it('should set status to inactive when quantity becomes 0', () => {
      subscription.update({ quantity: 0 });
      expect(subscription.quantity).toBe(0);
      expect(subscription.status).toBe('inactive');
    });

    it('should update status', () => {
      subscription.update({ status: StockSubscriptionStatus.PENDING });
      expect(subscription.status).toBe('pending');
    });

    it('should update financingLoanId', () => {
      subscription.update({ financingLoanId: 'loan-1' });
      expect(subscription.financingLoanId).toBe('loan-1');
    });

    it('should clear financingLoanId when set to null', () => {
      subscription.update({ financingLoanId: 'loan-1' });
      subscription.update({ financingLoanId: null });
      expect(subscription.financingLoanId).toBeNull();
    });

    it('should throw error when quantity becomes negative', () => {
      expect(() => subscription.update({ quantity: -1 })).toThrow(
        'StockSubscription quantity must be >= 0',
      );
    });

    it('should throw error for invalid status', () => {
      const invalidStatus = 'invalid' as StockSubscriptionStatus;
      expect(() => subscription.update({ status: invalidStatus })).toThrow(
        'Invalid StockSubscription status',
      );
    });
  });

  describe('markAsInactive method', () => {
    it('should mark subscription as inactive', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      expect(subscription.isActive()).toBe(true);
      subscription.markAsInactive();
      expect(subscription.isActive()).toBe(false);
      expect(subscription.status).toBe('inactive');
    });
  });

  describe('isActive method', () => {
    it('should return true for active subscription', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });
      expect(subscription.isActive()).toBe(true);
    });

    it('should return false for inactive subscription', () => {
      const subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 0,
      });
      expect(subscription.isActive()).toBe(false);
    });

    it('should return false for pending subscription', () => {
      const subscription = StockSubscription.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        stock_id: 'stock-1',
        quantity: 10,
        status: 'pending',
        purchase_date: mockDate,
      });
      expect(subscription.isActive()).toBe(false);
    });
  });

  describe('getters', () => {
    let subscription: StockSubscription;

    beforeEach(() => {
      subscription = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        financingLoanId: 'loan-1',
      });
    });

    it('should return memberId via getter', () => {
      expect(subscription.memberId).toBe('member-1');
    });

    it('should return stockId via getter', () => {
      expect(subscription.stockId).toBe('stock-1');
    });

    it('should return quantity via getter', () => {
      expect(subscription.quantity).toBe(10);
    });

    it('should return status via getter', () => {
      expect(subscription.status).toBe('active');
    });

    it('should return purchaseDate via getter', () => {
      expect(subscription.purchaseDate).toBeInstanceOf(Date);
    });

    it('should return financingLoanId via getter', () => {
      expect(subscription.financingLoanId).toBe('loan-1');
    });
  });
});
