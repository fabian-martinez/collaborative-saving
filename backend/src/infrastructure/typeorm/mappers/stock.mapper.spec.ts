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
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        deleted_at: null,
        stockTypeId: 'type-id-123',
      } as any;

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain).toBeInstanceOf(Stock);
      expect(domain.id).toBe(entity.id);
      expect(domain.name).toBe(entity.name);
      expect(domain.value).toBe(100);
      expect(domain.monthlyContribution).toBe(50);
      expect(domain.isGuaranteed).toBe(false);
      expect(domain.guaranteedYield).toBeNull();
      expect(domain.stockTypeId).toBe('type-id-123');
    });

    it('should handle guaranteed stock', () => {
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'guaranteed',
        value: 150,
        monthly_contribution: 75,
        is_guaranteed: true,
        guaranteed_yield: 0.02,
        deleted_at: null,
        stockTypeId: 'type-id-456',
      } as any;

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain.isGuaranteed).toBe(true);
      expect(domain.guaranteedYield).toBe(0.02);
      expect(domain.stockTypeId).toBe('type-id-456');
    });

    it('should handle deleted stock', () => {
      const deletedDate = new Date('2024-02-01');
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        deleted_at: deletedDate,
        stockTypeId: 'type-id-789',
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
      });
      domain.update({ stockTypeId: 'type-id-123' });

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.name).toBe(domain.name);
      expect(persistence.value).toBe(domain.value);
      expect(persistence.monthly_contribution).toBe(domain.monthlyContribution);
      expect(persistence.is_guaranteed).toBe(domain.isGuaranteed);
      expect(persistence.guaranteed_yield).toBe(domain.guaranteedYield);
      expect(persistence.stockTypeId).toBe(domain.stockTypeId);
    });

    it('should map deleted stock correctly', () => {
      const domain = Stock.create({
        name: 'test',
        value: 100,
        monthlyContribution: 50,
      });
      domain.update({ stockTypeId: 'type-id-456' });
      domain.markAsDeleted();

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.deleted_at).toEqual(domain.deletedAt);
      expect(persistence.stockTypeId).toBe(domain.stockTypeId);
    });

    it('should map guaranteed stock correctly', () => {
      const domain = Stock.create({
        name: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
      });
      domain.update({ stockTypeId: 'type-id-789' });

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.is_guaranteed).toBe(true);
      expect(persistence.guaranteed_yield).toBe(0.02);
      expect(persistence.stockTypeId).toBe(domain.stockTypeId);
    });
  });
});
