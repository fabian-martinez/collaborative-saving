/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockType } from './stock-type.entity';
import { StockBehavior } from '../enums/stock-behavior.enum';

describe('StockType Entity', () => {
  describe('create', () => {
    it('should create a valid StockType instance with auto-generated code and default behavior', () => {
      // ARRANGE & ACT
      const stockType = StockType.create({
        name: 'Acción Ordinaria',
        description: 'Acción común del fondo',
      });

      // ASSERT
      expect(stockType.id).toBeDefined();
      expect(stockType.code).toBe('accion_ordinaria');
      expect(stockType.name).toBe('Acción Ordinaria');
      expect(stockType.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
      expect(stockType.isGuaranteed).toBe(false);
      expect(stockType.guaranteedYield).toBeNull();
      expect(stockType.description).toBe('Acción común del fondo');
      expect(stockType.createdAt).toBeInstanceOf(Date);
      expect(stockType.updatedAt).toBeInstanceOf(Date);
      expect(stockType.deletedAt).toBeNull();
      expect(stockType.isDeleted()).toBe(false);
    });

    it('should create a guaranteed StockType with yield and custom behavior', () => {
      // ARRANGE & ACT
      const stockType = StockType.create({
        name: 'Acción Preferencial Garantizada',
        code: 'pref_garantizada',
        behavior: StockBehavior.DIVIDEND_YIELD,
        isGuaranteed: true,
        guaranteedYield: 0.025,
        description: 'Rendimiento fijo garantizado',
      });

      // ASSERT
      expect(stockType.code).toBe('pref_garantizada');
      expect(stockType.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
      expect(stockType.isGuaranteed).toBe(true);
      expect(stockType.guaranteedYield).toBe(0.025);
    });

    it('should ignore guaranteedYield if isGuaranteed is false', () => {
      // ARRANGE & ACT
      const stockType = StockType.create({
        name: 'Acción Normal',
        isGuaranteed: false,
        guaranteedYield: 0.05,
      });

      // ASSERT
      expect(stockType.isGuaranteed).toBe(false);
      expect(stockType.guaranteedYield).toBeNull();
    });

    it('should throw if name is empty', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        StockType.create({
          name: '   ',
        }),
      ).toThrow('StockType name cannot be empty');
    });

    it('should throw if code generated is empty', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        StockType.create({
          name: '$$$###',
        }),
      ).toThrow('StockType code cannot be empty');
    });

    it('should throw if guaranteed yield is negative', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        StockType.create({
          name: 'Invalida',
          isGuaranteed: true,
          guaranteedYield: -0.01,
        }),
      ).toThrow(
        'StockType guaranteed yield must be between 0 and 1 when stock is guaranteed',
      );
    });

    it('should throw if guaranteed yield is greater than 1', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        StockType.create({
          name: 'Invalida',
          isGuaranteed: true,
          guaranteedYield: 1.5,
        }),
      ).toThrow(
        'StockType guaranteed yield must be between 0 and 1 when stock is guaranteed',
      );
    });
  });

  describe('fromPersistence', () => {
    it('should reconstitute a StockType from persistence database record', () => {
      // ARRANGE
      const rawData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'cdt_fijo',
        name: 'CDT Fijo',
        behavior: 'DIVIDEND_YIELD',
        is_guaranteed: true,
        guaranteed_yield: '0.0350',
        description: 'CDT persistido',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
        deleted_at: null,
      };

      // ACT
      const stockType = StockType.fromPersistence(rawData);

      // ASSERT
      expect(stockType.id).toBe(rawData.id);
      expect(stockType.code).toBe('cdt_fijo');
      expect(stockType.name).toBe('CDT Fijo');
      expect(stockType.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
      expect(stockType.isGuaranteed).toBe(true);
      expect(stockType.guaranteedYield).toBe(0.035);
      expect(stockType.description).toBe('CDT persistido');
      expect(stockType.createdAt).toEqual(new Date(rawData.created_at));
      expect(stockType.updatedAt).toEqual(new Date(rawData.updated_at));
      expect(stockType.isDeleted()).toBe(false);
    });

    it('should handle deleted_at timestamp in fromPersistence', () => {
      // ARRANGE
      const rawData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'antigua',
        name: 'Acción Antigua',
        behavior: 'CAPITAL_APPRECIATION',
        is_guaranteed: false,
        guaranteed_yield: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: '2026-03-01T12:00:00.000Z',
      };

      // ACT
      const stockType = StockType.fromPersistence(rawData);

      // ASSERT
      expect(stockType.isDeleted()).toBe(true);
      expect(stockType.deletedAt).toEqual(new Date('2026-03-01T12:00:00.000Z'));
    });
  });

  describe('update', () => {
    it('should update properties and update updatedAt timestamp', () => {
      // ARRANGE
      const stockType = StockType.create({
        name: 'Inicial',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        isGuaranteed: false,
      });
      const oldUpdatedAt = stockType.updatedAt;

      // ACT
      stockType.update({
        name: 'Nombre Actualizado',
        behavior: StockBehavior.DIVIDEND_YIELD,
        isGuaranteed: true,
        guaranteedYield: 0.04,
        description: 'Nueva descripción',
      });

      // ASSERT
      expect(stockType.name).toBe('Nombre Actualizado');
      expect(stockType.behavior).toBe(StockBehavior.DIVIDEND_YIELD);
      expect(stockType.isGuaranteed).toBe(true);
      expect(stockType.guaranteedYield).toBe(0.04);
      expect(stockType.description).toBe('Nueva descripción');
      expect(stockType.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it('should clear guaranteedYield when isGuaranteed is updated to false', () => {
      // ARRANGE
      const stockType = StockType.create({
        name: 'Inicial',
        isGuaranteed: true,
        guaranteedYield: 0.05,
      });

      // ACT
      stockType.update({
        isGuaranteed: false,
      });

      // ASSERT
      expect(stockType.isGuaranteed).toBe(false);
      expect(stockType.guaranteedYield).toBeNull();
    });

    it('should throw if updated with invalid yield', () => {
      // ARRANGE
      const stockType = StockType.create({
        name: 'Inicial',
        isGuaranteed: true,
        guaranteedYield: 0.05,
      });

      // ACT & ASSERT
      expect(() =>
        stockType.update({
          guaranteedYield: -0.1,
        }),
      ).toThrow(
        'StockType guaranteed yield must be between 0 and 1 when stock is guaranteed',
      );
    });

    it('should mark as deleted', () => {
      // ARRANGE
      const stockType = StockType.create({ name: 'Por borrar' });

      // ACT
      stockType.markAsDeleted();

      // ASSERT
      expect(stockType.isDeleted()).toBe(true);
      expect(stockType.deletedAt).toBeInstanceOf(Date);
    });
  });
});
