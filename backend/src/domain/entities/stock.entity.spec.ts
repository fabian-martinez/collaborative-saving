import { Stock, StockBehavior } from './stock.entity';

describe('Stock Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create Stock with minimal required fields', () => {
      const stock = Stock.create({
        type: 'preferential',
        value: 100,
        monthlyContribution: 50,
      });

      expect(stock.id).toBeDefined();
      expect(stock.type).toBe('preferential');
      expect(stock.value).toBe(100);
      expect(stock.monthlyContribution).toBe(50);
      expect(stock.isGuaranteed).toBe(false);
      expect(stock.guaranteedYield).toBe(null);
      expect(stock.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
      expect(stock.createdAt).toBeInstanceOf(Date);
      expect(stock.deletedAt).toBeNull();
    });

    it('should create Stock with all fields', () => {
      const stock = Stock.create({
        type: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
      });

      expect(stock.type).toBe('guaranteed');
      expect(stock.value).toBe(150);
      expect(stock.monthlyContribution).toBe(75);
      expect(stock.isGuaranteed).toBe(true);
      expect(stock.guaranteedYield).toBe(0.02);
      expect(stock.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
    });

    it('should default behavior to CAPITAL_APPRECIATION when not provided', () => {
      const stock = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
      });

      expect(stock.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
    });

    it('should throw error if value is negative', () => {
      expect(() => {
        Stock.create({
          type: 'test',
          value: -10,
          monthlyContribution: 50,
        });
      }).toThrow('Stock value must be >= 0');
    });

    it('should throw error if monthlyContribution is negative', () => {
      expect(() => {
        Stock.create({
          type: 'test',
          value: 100,
          monthlyContribution: -10,
        });
      }).toThrow('Stock monthly contribution must be >= 0');
    });

    it('should throw error if guaranteed yield is negative', () => {
      expect(() => {
        Stock.create({
          type: 'test',
          value: 100,
          monthlyContribution: 50,
          isGuaranteed: true,
          guaranteedYield: -0.01,
        });
      }).toThrow('Guaranteed yield must be >= 0 when stock is guaranteed');
    });

    it('should throw error if type is empty', () => {
      expect(() => {
        Stock.create({
          type: '',
          value: 100,
          monthlyContribution: 50,
        });
      }).toThrow('Stock type is required');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create Stock from persistence data', () => {
      const stock = Stock.fromPersistence({
        id: mockId,
        type: 'preferential',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        created_at: mockDate,
        deleted_at: null,
      });

      expect(stock.id).toBe(mockId);
      expect(stock.type).toBe('preferential');
      expect(stock.value).toBe(100);
      expect(stock.monthlyContribution).toBe(50);
      expect(stock.createdAt).toEqual(mockDate);
      expect(stock.deletedAt).toBeNull();
    });

    it('should handle string dates', () => {
      const stock = Stock.fromPersistence({
        id: mockId,
        type: 'test',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        created_at: '2024-01-15T00:00:00.000Z',
        deleted_at: null,
      });

      expect(stock.createdAt).toBeInstanceOf(Date);
    });

    it('should handle deleted_at date', () => {
      const deletedDate = new Date('2024-02-01');
      const stock = Stock.fromPersistence({
        id: mockId,
        type: 'test',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        created_at: mockDate,
        deleted_at: deletedDate,
      });

      expect(stock.deletedAt).toEqual(deletedDate);
      expect(stock.isDeleted()).toBe(true);
    });

    it('should handle stock_type_id', () => {
      const stock = Stock.fromPersistence({
        id: mockId,
        type: 'test',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        created_at: mockDate,
        stock_type_id: 'stock-type-123',
      });

      expect(stock.stockTypeId).toBe('stock-type-123');
    });
  });

  describe('update method', () => {
    it('should update stock fields', () => {
      const stock = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
      });

      stock.update({
        value: 150,
        monthlyContribution: 75,
      });

      expect(stock.value).toBe(150);
      expect(stock.monthlyContribution).toBe(75);
      expect(stock.type).toBe('test'); // unchanged
    });

    it('should update guaranteed fields when isGuaranteed is true', () => {
      const stock = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
        isGuaranteed: false,
      });

      stock.update({
        isGuaranteed: true,
        guaranteedYield: 0.02,
      });

      expect(stock.isGuaranteed).toBe(true);
      expect(stock.guaranteedYield).toBe(0.02);
    });

    it('should clear guaranteedYield when isGuaranteed is false', () => {
      const stock = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
        isGuaranteed: true,
        guaranteedYield: 0.02,
      });

      stock.update({
        isGuaranteed: false,
      });

      expect(stock.isGuaranteed).toBe(false);
      expect(stock.guaranteedYield).toBe(null);
    });

    it('should validate invariants after update', () => {
      const stock = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
      });

      expect(() => {
        stock.update({ value: -10 });
      }).toThrow('Stock value must be >= 0');
    });

    it('should update stockTypeId', () => {
      const stock = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
      });

      stock.update({ stockTypeId: 'new-type-id' });
      expect(stock.stockTypeId).toBe('new-type-id');
    });
  });

  describe('markAsDeleted method', () => {
    it('should mark stock as deleted', () => {
      const stock = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
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
        type: 'test',
        value: 100,
        monthlyContribution: 50,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
      });

      expect(stock.type).toBe('test');
      expect(stock.value).toBe(100);
      expect(stock.monthlyContribution).toBe(50);
      expect(stock.isGuaranteed).toBe(true);
      expect(stock.guaranteedYield).toBe(0.02);
      expect(stock.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
    });
  });
});
