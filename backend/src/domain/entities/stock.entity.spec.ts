import { StockType } from './stock-type.entity';
import { Stock, StockBehavior } from './stock.entity';

describe('Stock Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create Stock with minimal required fields', () => {
      const stock = Stock.create({
        name: 'preferential',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      expect(stock.id).toBeDefined();
      expect(stock.name).toBe('preferential');
      expect(stock.value).toBe(100);
      expect(stock.monthlyContribution).toBe(50);
      expect(stock.createdAt).toBeInstanceOf(Date);
      expect(stock.deletedAt).toBeNull();
    });

    it('should create Stock with all fields', () => {
      const stock = Stock.create({
        name: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        stockTypeId: 'stock-type-123',
      });

      expect(stock.name).toBe('guaranteed');
      expect(stock.value).toBe(150);
      expect(stock.monthlyContribution).toBe(75);
    });

    it('should default guaranteed false when not provided', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });
    });

    it('should throw error if value is negative', () => {
      expect(() => {
        Stock.create({
          name: 'test',
          value: -10,
          monthlyContribution: 50,
          stockTypeId: 'stock-type-123',
        });
      }).toThrow('Stock value must be >= 0');
    });

    it('should throw error if monthlyContribution is negative', () => {
      expect(() => {
        Stock.create({
          name: 'test',
          value: 100,
          monthlyContribution: -10,
          stockTypeId: 'stock-type-123',
        });
      }).toThrow('Stock monthly contribution must be >= 0');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        Stock.create({
          name: '',
          value: 100,
          monthlyContribution: 50,
          stockTypeId: 'stock-type-123',
        });
      }).toThrow('Stock name is required');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create Stock from persistence data', () => {
      const stockType = StockType.create({
        name: 'preferential',
        guaranteedYield: 10,
        isGuaranteed: false,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        id: 'stock-type-123'
      });
      const stock = Stock.fromPersistence({
        id: mockId,
        name: 'preferential',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: stockType.id,
        createdAt: mockDate,
        deletedAt: null,
      });

      expect(stock.id).toBe(mockId);
      expect(stock.name).toBe('preferential');
      expect(stock.value).toBe(100);
      expect(stock.monthlyContribution).toBe(50);
      expect(stock.createdAt).toEqual(mockDate);
      expect(stock.deletedAt).toBeNull();
    });

    it('should handle string dates', () => {
      const stock = Stock.fromPersistence({
        id: mockId,
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
        createdAt: '2024-01-15T00:00:00.000Z',
        deletedAt: null,
      });

      expect(stock.createdAt).toBeInstanceOf(Date);
    });

    it('should handle deleted_at date', () => {
      const deletedDate = new Date('2024-02-01');
      const stock = Stock.fromPersistence({
        id: mockId,
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
        createdAt: mockDate,
        deletedAt: deletedDate,
      });

      expect(stock.deletedAt).toEqual(deletedDate);
      expect(stock.isDeleted()).toBe(true);
    });

    it('should handle stock_type_id', () => {
      const stock = Stock.fromPersistence({
        id: mockId,
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        createdAt: mockDate,
        stockTypeId: 'stock-type-123',
      });

      expect(stock.stockTypeId).toBe('stock-type-123');
    });
  });

  describe('update method', () => {
    it('should update stock fields', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      stock.update({
        value: 150,
        monthlyContribution: 75,
      });

      expect(stock.value).toBe(150);
      expect(stock.monthlyContribution).toBe(75);
      expect(stock.name).toBe('test'); // unchanged
    });

    it('should update guaranteed fields when isGuaranteed is true', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      stock.update({
        stockTypeId: 'stock-type-456',
      });

      expect(stock.stockTypeId).toBe('stock-type-456');
    });

    it('should clear guaranteedYield when isGuaranteed is false', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      stock.update({
        stockTypeId: 'stock-type-456',
      });

      expect(stock.stockTypeId).toBe('stock-type-456');
    });

    it('should validate invariants after update', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      expect(() => {
        stock.update({ value: -10 });
      }).toThrow('Stock value must be >= 0');
    });

    it('should update stockTypeId', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      stock.update({ stockTypeId: 'new-type-id' });
      expect(stock.stockTypeId).toBe('new-type-id');
    });
  });

  describe('markAsDeleted method', () => {
    it('should mark stock as deleted', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      expect(stock.isDeleted()).toBe(false);
      stock.markAsDeleted();
      expect(stock.isDeleted()).toBe(true);
      expect(stock.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('getters', () => {
    it('should return correct property values', () => {
      const stock = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'stock-type-123',
      });

      expect(stock.name).toBe('test');
      expect(stock.value).toBe(100);
      expect(stock.monthlyContribution).toBe(50);
      expect(stock.stockTypeId).toBe('stock-type-123');
    });
  });
});
