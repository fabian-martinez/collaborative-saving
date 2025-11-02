import { StockSubscriptionMapper } from './stock-subscription.mapper';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { StockSubscription as StockSubscriptionEntity } from '../entities/stock-subscription.entity';

describe('StockSubscriptionMapper', () => {
  describe('toDomain', () => {
    it('should map StockSubscriptionEntity to Domain StockSubscription', () => {
      const entity: Partial<StockSubscriptionEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        status: 'active',
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: null,
      };

      const domain = StockSubscriptionMapper.toDomain(
        entity as StockSubscriptionEntity,
      );

      expect(domain).toBeInstanceOf(StockSubscription);
      expect(domain.id).toBe(entity.id);
      expect(domain.memberId).toBe(entity.memberId);
      expect(domain.stockId).toBe(entity.stockId);
      expect(domain.quantity).toBe(entity.quantity);
      expect(domain.status).toBe(entity.status);
    });

    it('should handle null optional fields', () => {
      const entity: Partial<StockSubscriptionEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        status: 'active',
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: null,
      };

      const domain = StockSubscriptionMapper.toDomain(
        entity as StockSubscriptionEntity,
      );

      // financingLoanId can be null or undefined, both are valid
      expect(
        domain.financingLoanId === null || domain.financingLoanId === undefined,
      ).toBe(true);
    });

    it('should handle financingLoanId with value', () => {
      const entity: Partial<StockSubscriptionEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        status: 'active',
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: 'loan-1',
      };

      const domain = StockSubscriptionMapper.toDomain(
        entity as StockSubscriptionEntity,
      );

      expect(domain.financingLoanId).toBe('loan-1');
    });

    it('should throw error for invalid status', () => {
      const entity: Partial<StockSubscriptionEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        status: 'invalid-status',
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: null,
      };

      expect(() =>
        StockSubscriptionMapper.toDomain(entity as StockSubscriptionEntity),
      ).toThrow('Failed to map StockSubscription to domain');
    });
  });

  describe('toPersistence', () => {
    it('should map Domain StockSubscription to StockSubscriptionEntity', () => {
      const domain = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        financingLoanId: 'loan-1',
      });

      const persistence = StockSubscriptionMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.memberId).toBe(domain.memberId);
      expect(persistence.stockId).toBe(domain.stockId);
      expect(persistence.quantity).toBe(domain.quantity);
      expect(persistence.status).toBe(domain.status);
      expect(persistence.purchaseDate).toBe(domain.purchaseDate);
      expect(persistence.financingLoanId).toBe('loan-1');
    });

    it('should map nullable financingLoanId as null', () => {
      const domain = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      const persistence = StockSubscriptionMapper.toPersistence(domain);

      expect(persistence.financingLoanId).toBeNull();
    });

    it('should preserve all required fields', () => {
      const domain = StockSubscription.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      const persistence = StockSubscriptionMapper.toPersistence(domain);

      expect(persistence.id).toBeDefined();
      expect(persistence.memberId).toBe('member-1');
      expect(persistence.stockId).toBe('stock-1');
      expect(persistence.quantity).toBe(10);
      expect(persistence.status).toBe('active');
      expect(persistence.purchaseDate).toBeInstanceOf(Date);
    });
  });
});
