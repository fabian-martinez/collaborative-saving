import { StockValueHistoryMapper } from './stock-value-history.mapper';
import { StockValueHistory } from '@domain/entities/stock-value-history.entity';
import { StockValueHistory as StockValueHistoryEntity } from '../entities/stock-value-history.entity';

describe('StockValueHistoryMapper', () => {
  describe('toDomain', () => {
    it('should map StockValueHistoryEntity to Domain', () => {
      const entity: Partial<StockValueHistoryEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
        createdAt: new Date('2024-01-15'),
      };

      const domain = StockValueHistoryMapper.toDomain(
        entity as StockValueHistoryEntity,
      );

      expect(domain).toBeInstanceOf(StockValueHistory);
      expect(domain.id).toBe(entity.id);
      expect(domain.stockId).toBe('stock-1');
      expect(domain.newValue).toBe(115);
    });
  });

  describe('toPersistence', () => {
    it('should map Domain to StockValueHistoryEntity', () => {
      const domain = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });

      const persistence = StockValueHistoryMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.stockId).toBe(domain.stockId);
      expect(persistence.newValue).toBe(115);
    });
  });
});

