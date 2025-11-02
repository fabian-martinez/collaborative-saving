import { StockValueHistory } from './stock-value-history.entity';

describe('StockValueHistory Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create StockValueHistory with required fields', () => {
      const history = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });

      expect(history.id).toBeDefined();
      expect(history.stockId).toBe('stock-1');
      expect(history.operationId).toBe('operation-1');
      expect(history.previousValue).toBe(100);
      expect(history.growthFromContributions).toBe(10);
      expect(history.growthFromInterest).toBe(5);
      expect(history.totalGrowthPerShare).toBe(15);
      expect(history.newValue).toBe(115);
      expect(history.createdAt).toBeInstanceOf(Date);
    });

    it('should validate newValue equals previousValue + growthFromContributions + growthFromInterest', () => {
      const history = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115, // 100 + 10 + 5 = 115
      });

      expect(history.newValue).toBe(115);
    });

    it('should generate unique IDs for each history', () => {
      const h1 = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });
      const h2 = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });

      expect(h1.id).not.toBe(h2.id);
    });

    it('should throw error when newValue does not match calculation', () => {
      expect(() =>
        StockValueHistory.create({
          stockId: 'stock-1',
          operationId: 'operation-1',
          previousValue: 100,
          growthFromContributions: 10,
          growthFromInterest: 5,
          totalGrowthPerShare: 15,
          newValue: 120, // Should be 115, not 120
        }),
      ).toThrow(
        'StockValueHistory new_value must equal previous_value + growth_from_contributions + growth_from_interest',
      );
    });

    it('should throw error for negative previousValue', () => {
      expect(() =>
        StockValueHistory.create({
          stockId: 'stock-1',
          operationId: 'operation-1',
          previousValue: -10,
          growthFromContributions: 10,
          growthFromInterest: 5,
          totalGrowthPerShare: 15,
          newValue: 5,
        }),
      ).toThrow('Stock value history values must be >= 0');
    });

    it('should throw error for negative newValue', () => {
      expect(() =>
        StockValueHistory.create({
          stockId: 'stock-1',
          operationId: 'operation-1',
          previousValue: 100,
          growthFromContributions: -110,
          growthFromInterest: 0,
          totalGrowthPerShare: -110,
          newValue: -10,
        }),
      ).toThrow('Stock value history values must be >= 0');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create StockValueHistory from persistence data', () => {
      const history = StockValueHistory.fromPersistence({
        id: mockId,
        stock_id: 'stock-1',
        operation_id: 'operation-1',
        previous_value: 100,
        growth_from_contributions: 10,
        growth_from_interest: 5,
        total_growth_per_share: 15,
        new_value: 115,
        created_at: mockDate,
      });

      expect(history.id).toBe(mockId);
      expect(history.stockId).toBe('stock-1');
      expect(history.operationId).toBe('operation-1');
      expect(history.previousValue).toBe(100);
      expect(history.newValue).toBe(115);
    });

    it('should handle string dates', () => {
      const history = StockValueHistory.fromPersistence({
        id: mockId,
        stock_id: 'stock-1',
        operation_id: 'operation-1',
        previous_value: 100,
        growth_from_contributions: 10,
        growth_from_interest: 5,
        total_growth_per_share: 15,
        new_value: 115,
        created_at: '2024-01-15T10:00:00Z',
      });

      expect(history.createdAt).toBeInstanceOf(Date);
    });

    it('should handle string numbers', () => {
      const history = StockValueHistory.fromPersistence({
        id: mockId,
        stock_id: 'stock-1',
        operation_id: 'operation-1',
        previous_value: '100.50',
        growth_from_contributions: '10.25',
        growth_from_interest: '5.10',
        total_growth_per_share: '15.35',
        new_value: '115.85',
        created_at: mockDate,
      });

      expect(history.previousValue).toBe(100.5);
      expect(history.growthFromContributions).toBe(10.25);
      expect(history.growthFromInterest).toBe(5.1);
      expect(history.newValue).toBe(115.85);
    });
  });

  describe('getters', () => {
    let history: StockValueHistory;

    beforeEach(() => {
      history = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });
    });

    it('should return stockId via getter', () => {
      expect(history.stockId).toBe('stock-1');
    });

    it('should return operationId via getter', () => {
      expect(history.operationId).toBe('operation-1');
    });

    it('should return previousValue via getter', () => {
      expect(history.previousValue).toBe(100);
    });

    it('should return growthFromContributions via getter', () => {
      expect(history.growthFromContributions).toBe(10);
    });

    it('should return growthFromInterest via getter', () => {
      expect(history.growthFromInterest).toBe(5);
    });

    it('should return totalGrowthPerShare via getter', () => {
      expect(history.totalGrowthPerShare).toBe(15);
    });

    it('should return newValue via getter', () => {
      expect(history.newValue).toBe(115);
    });

    it('should return createdAt via getter', () => {
      expect(history.createdAt).toBeInstanceOf(Date);
    });
  });
});
