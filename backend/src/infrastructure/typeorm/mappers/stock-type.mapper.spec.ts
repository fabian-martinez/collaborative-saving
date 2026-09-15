/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockTypeMapper } from './stock-type.mapper';
import { StockType as StockTypeEntity } from '../entities/stock-type.entity';
import { StockType as StockTypeDomain } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

describe('StockTypeMapper', () => {
  describe('toDomain', () => {
    it('should correctly map entity to domain model', () => {
      // ARRANGE
      const entity: StockTypeEntity = {
        id: '681c73c5-0f84-449e-9571-a685462e256f',
        code: 'preferencial',
        name: 'Preferencial',
        behavior: StockBehavior.DIVIDEND_YIELD,
        is_guaranteed: true,
        guaranteed_yield: 0.02,
        description: 'Acción preferencial',
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-02'),
        deleted_at: null,
      };

      // ACT
      const domain = StockTypeMapper.toDomain(entity);

      // ASSERT
      expect(domain).toBeInstanceOf(StockTypeDomain);
      expect(domain.id).toBe(entity.id);
      expect(domain.code).toBe('preferencial');
      expect(domain.name).toBe('Preferencial');
      expect(domain.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
      expect(domain.isGuaranteed).toBe(true);
      expect(domain.guaranteedYield).toBe(0.02);
      expect(domain.description).toBe('Acción preferencial');
      expect(domain.createdAt).toEqual(entity.created_at);
      expect(domain.updatedAt).toEqual(entity.updated_at);
      expect(domain.deletedAt).toBeNull();
    });

    it('should throw an error with descriptive message when mapping fails', () => {
      // ARRANGE
      const invalidEntity = {
        id: '',
        code: '',
        name: '',
        behavior: 'INVALID_BEHAVIOR',
      } as unknown as StockTypeEntity;

      // ACT & ASSERT
      expect(() => StockTypeMapper.toDomain(invalidEntity)).toThrow(
        /Failed to map StockType to domain:/,
      );
    });
  });

  describe('toPersistence', () => {
    it('should correctly map domain model to persistence entity', () => {
      // ARRANGE
      const domain = StockTypeDomain.create({
        name: 'Ordinaria',
        code: 'ordinaria',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
        description: 'Acción ordinaria',
      });

      // ACT
      const persistence = StockTypeMapper.toPersistence(domain);

      // ASSERT
      expect(persistence.id).toBe(domain.id);
      expect(persistence.code).toBe('ordinaria');
      expect(persistence.name).toBe('Ordinaria');
      expect(persistence.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
      expect(persistence.is_guaranteed).toBe(false);
      expect(persistence.guaranteed_yield).toBeNull();
      expect(persistence.description).toBe('Acción ordinaria');
      expect(persistence.deleted_at).toBeNull();
    });
  });
});
