import { StockMapper } from './stock.mapper';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { Stock as StockEntity } from '../entities/stock.entity';

describe('StockMapper', () => {
  describe('toDomain', () => {
    it('should map StockEntity to Domain Stock', () => {
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'preferential',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      };

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain).toBeInstanceOf(Stock);
      expect(domain.id).toBe(entity.id);
      expect(domain.name).toBe(entity.type);
      expect(domain.type).toBe(entity.type);
      expect(domain.value).toBe(100);
      expect(domain.monthlyContribution).toBe(50);
      expect(domain.isGuaranteed).toBe(false);
      expect(domain.guaranteedYield).toBeNull();
      expect(domain.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
    });

    it('should map StockEntity with name and stock_type_id', () => {
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Acción Ordinaria',
        stock_type_id: 'st-uuid-1',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      };

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain.name).toBe('Acción Ordinaria');
      expect(domain.type).toBe('Acción Ordinaria');
      expect(domain.stockTypeId).toBe('st-uuid-1');
    });

    it('should handle guaranteed stock', () => {
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'guaranteed',
        value: 150,
        monthly_contribution: 75,
        is_guaranteed: true,
        guaranteed_yield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
        deleted_at: null,
      };

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain.isGuaranteed).toBe(true);
      expect(domain.guaranteedYield).toBe(0.02);
      expect(domain.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
    });

    it('should handle deleted stock', () => {
      const deletedDate = new Date('2024-02-01');
      const entity: Partial<StockEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'test',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: deletedDate,
      };

      const domain = StockMapper.toDomain(entity as StockEntity);

      expect(domain.deletedAt).toEqual(deletedDate);
      expect(domain.isDeleted()).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('should map Domain Stock to StockEntity', () => {
      const domain = Stock.create({
        type: 'preferential',
        value: 100,
        monthlyContribution: 50,
      });

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.type).toBe(domain.type);
      expect(persistence.value).toBe(domain.value);
      expect(persistence.monthly_contribution).toBe(domain.monthlyContribution);
      expect(persistence.is_guaranteed).toBe(domain.isGuaranteed);
      expect(persistence.guaranteed_yield).toBe(domain.guaranteedYield);
      expect(persistence.behavior).toBe(domain.behavior);
    });

    it('should map deleted stock correctly', () => {
      const domain = Stock.create({
        type: 'test',
        value: 100,
        monthlyContribution: 50,
      });
      domain.markAsDeleted();

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.deleted_at).toEqual(domain.deletedAt);
    });

    it('should map guaranteed stock correctly', () => {
      const domain = Stock.create({
        type: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
      });

      const persistence = StockMapper.toPersistence(domain);

      expect(persistence.is_guaranteed).toBe(true);
      expect(persistence.guaranteed_yield).toBe(0.02);
      expect(persistence.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
    });
  });
});
