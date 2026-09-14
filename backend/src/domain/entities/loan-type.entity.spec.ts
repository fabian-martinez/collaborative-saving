/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanType } from './loan-type.entity';

describe('LoanType Entity', () => {
  describe('create', () => {
    it('should create a valid LoanType instance with auto-generated code and UUID', () => {
      // ARRANGE & ACT
      const loanType = LoanType.create({
        name: 'Préstamo Ágil',
        interestRate: 0.02,
        description: 'Préstamo rápido',
      });

      // ASSERT
      expect(loanType.id).toBeDefined();
      expect(loanType.code).toBe('prestamo_agil');
      expect(loanType.name).toBe('Préstamo Ágil');
      expect(loanType.interestRate).toBe(0.02);
      expect(loanType.description).toBe('Préstamo rápido');
      expect(loanType.createdAt).toBeInstanceOf(Date);
      expect(loanType.updatedAt).toBeInstanceOf(Date);
      expect(loanType.deletedAt).toBeNull();
      expect(loanType.isDeleted()).toBe(false);
    });

    it('should use explicitly provided code when passed', () => {
      // ARRANGE & ACT
      const loanType = LoanType.create({
        name: 'Préstamo Personal',
        code: 'personal_custom',
        interestRate: 0.018,
      });

      // ASSERT
      expect(loanType.code).toBe('personal_custom');
      expect(loanType.description).toBeNull();
    });

    it('should throw if name is empty', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        LoanType.create({
          name: '   ',
          interestRate: 0.015,
        }),
      ).toThrow('LoanType name cannot be empty');
    });

    it('should throw if code generated or provided is empty', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        LoanType.create({
          name: '$$$###',
          code: '',
          interestRate: 0.015,
        }),
      ).toThrow('LoanType code cannot be empty');
    });

    it('should throw if interest rate is negative', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        LoanType.create({
          name: 'Corriente',
          interestRate: -0.01,
        }),
      ).toThrow('LoanType interest rate must be between 0 and 1');
    });

    it('should throw if interest rate is greater than 1', () => {
      // ARRANGE & ACT & ASSERT
      expect(() =>
        LoanType.create({
          name: 'Corriente',
          interestRate: 1.5,
        }),
      ).toThrow('LoanType interest rate must be between 0 and 1');
    });
  });

  describe('fromPersistence', () => {
    it('should reconstruct a LoanType entity correctly', () => {
      // ARRANGE
      const raw = {
        id: '681c73c5-0f84-449e-9571-a685462e256f',
        code: 'corriente',
        name: 'Corriente',
        interest_rate: '0.0150',
        description: 'Préstamo corriente',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
        deleted_at: null,
      };

      // ACT
      const loanType = LoanType.fromPersistence(raw);

      // ASSERT
      expect(loanType.id).toBe(raw.id);
      expect(loanType.code).toBe('corriente');
      expect(loanType.name).toBe('Corriente');
      expect(loanType.interestRate).toBe(0.015);
      expect(loanType.description).toBe('Préstamo corriente');
      expect(loanType.createdAt).toEqual(new Date(raw.created_at));
      expect(loanType.updatedAt).toEqual(new Date(raw.updated_at));
      expect(loanType.deletedAt).toBeNull();
    });

    it('should handle deleted_at timestamp in fromPersistence', () => {
      // ARRANGE
      const raw = {
        id: '681c73c5-0f84-449e-9571-a685462e256f',
        code: 'corriente',
        name: 'Corriente',
        interest_rate: 0.015,
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-02'),
        deleted_at: '2026-01-03T00:00:00Z',
      };

      // ACT
      const loanType = LoanType.fromPersistence(raw);

      // ASSERT
      expect(loanType.isDeleted()).toBe(true);
      expect(loanType.deletedAt).toEqual(new Date('2026-01-03T00:00:00Z'));
    });
  });

  describe('update', () => {
    it('should update name, interestRate, and description correctly', () => {
      // ARRANGE
      const loanType = LoanType.create({
        name: 'Antiguo',
        interestRate: 0.015,
      });

      // ACT
      loanType.update({
        name: 'Nuevo Nombre',
        interestRate: 0.025,
        description: 'Nueva descripción',
      });

      // ASSERT
      expect(loanType.name).toBe('Nuevo Nombre');
      expect(loanType.interestRate).toBe(0.025);
      expect(loanType.description).toBe('Nueva descripción');
    });

    it('should clear description when set to empty or null', () => {
      // ARRANGE
      const loanType = LoanType.create({
        name: 'Antiguo',
        interestRate: 0.015,
        description: 'Algo',
      });

      // ACT
      loanType.update({ description: null });

      // ASSERT
      expect(loanType.description).toBeNull();
    });

    it('should throw on update if invalid interest rate is provided', () => {
      // ARRANGE
      const loanType = LoanType.create({
        name: 'Antiguo',
        interestRate: 0.015,
      });

      // ACT & ASSERT
      expect(() => loanType.update({ interestRate: -0.1 })).toThrow(
        'LoanType interest rate must be between 0 and 1',
      );
    });
  });
});
