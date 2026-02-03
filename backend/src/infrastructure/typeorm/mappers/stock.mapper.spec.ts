import { StockMapper } from './stock.mapper';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { Stock as StockEntity } from '../entities/stock.entity';

describe('StockMapper', () => {
  describe('toDomain', () => {
    it('should map StockEntity to Domain Stock', () => {
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'preferential',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'type-id-123',
        stockType: {
          id: 'type-id-123',
          name: 'Type 1',
          isGuaranteed: false,
          guaranteedYield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
        } as any,
        deleted_at: null,
      } as any;

      const domain = StockMapper.toDomain(entity as StockEntity);

      console.log('Domain:::',domain);
      expect(domain).toBeInstanceOf(Stock);
      expect(domain.id).toBe(entity.id);
      expect(domain.name).toBe(entity.name);
      expect(domain.value).toBe(100);
      expect(domain.monthlyContribution).toBe(50);
      expect(domain.stockTypeId).toBe('type-id-123');
    });

    it('should handle guaranteed stock', () => {
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        stockTypeId: 'type-id-456',
        stockType: {
          id: 'type-id-456',
          name: 'Type 2',
          isGuaranteed: true,
          guaranteedYield: 0.02,
          behavior: StockBehavior.DIVIDEND_YIELD,
        } as any,
        deleted_at: null,
      } as any;

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain.stockTypeId).toBe('type-id-456');
    });

    it('should handle deleted stock', () => {
      const deletedDate = new Date('2024-02-01');
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'type-id-789',
        stockType: {
          id: 'type-id-789',
          name: 'Type 3',
          isGuaranteed: false,
          guaranteedYield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
        } as any,
        deletedAt: deletedDate,
      } as any;

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain.deletedAt).toEqual(deletedDate);
      expect(domain.isDeleted()).toBe(true);
      expect(domain.stockTypeId).toBe('type-id-789');
    });
  });

  describe('toPersistence', () => {
    it('should map Domain Stock to StockEntity', () => {
      const domain = Stock.create({
        name: 'preferential',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'type-id-123',
      });

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.name).toBe(domain.name);
      expect(persistence.value).toBe(domain.value);
      expect(persistence.monthlyContribution).toBe(domain.monthlyContribution);
      expect(persistence.stockTypeId).toBe(domain.stockTypeId);
    });

    it('should map deleted stock correctly', () => {
      const domain = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
        stockTypeId: 'type-id-456',
      });
      domain.markAsDeleted();

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.deletedAt).toEqual(domain.deletedAt);
      expect(persistence.stockTypeId).toBe(domain.stockTypeId);
    });

    it('should map guaranteed stock correctly', () => {
      const domain = Stock.create({
        name: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        stockTypeId: 'type-id-789',
      });

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.stockTypeId).toBe(domain.stockTypeId);
    });
  });
});
