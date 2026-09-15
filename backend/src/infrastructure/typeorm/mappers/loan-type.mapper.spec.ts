/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanTypeMapper } from './loan-type.mapper';
import { LoanType as LoanTypeEntity } from '../entities/loan-type.entity';
import { LoanType as LoanTypeDomain } from '@domain/entities/loan-type.entity';

describe('LoanTypeMapper', () => {
  describe('toDomain', () => {
    it('should correctly map entity to domain model', () => {
      // ARRANGE
      const entity: LoanTypeEntity = {
        id: '681c73c5-0f84-449e-9571-a685462e256f',
        code: 'corriente',
        name: 'Corriente',
        interest_rate: 0.015,
        description: 'Préstamo corriente',
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-02'),
        deleted_at: null,
      };

      // ACT
      const domain = LoanTypeMapper.toDomain(entity);

      // ASSERT
      expect(domain).toBeInstanceOf(LoanTypeDomain);
      expect(domain.id).toBe(entity.id);
      expect(domain.code).toBe('corriente');
      expect(domain.name).toBe('Corriente');
      expect(domain.interestRate).toBe(0.015);
      expect(domain.description).toBe('Préstamo corriente');
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
        interest_rate: -1,
      } as unknown as LoanTypeEntity;

      // ACT & ASSERT
      expect(() => LoanTypeMapper.toDomain(invalidEntity)).toThrow(
        /Failed to map LoanType to domain:/,
      );
    });
  });

  describe('toPersistence', () => {
    it('should correctly map domain model to persistence entity', () => {
      // ARRANGE
      const domain = LoanTypeDomain.create({
        name: 'Ágil',
        code: 'agil',
        interestRate: 0.02,
        description: 'Préstamo ágil',
      });

      // ACT
      const persistence = LoanTypeMapper.toPersistence(domain);

      // ASSERT
      expect(persistence.id).toBe(domain.id);
      expect(persistence.code).toBe('agil');
      expect(persistence.name).toBe('Ágil');
      expect(persistence.interest_rate).toBe(0.02);
      expect(persistence.description).toBe('Préstamo ágil');
      expect(persistence.deleted_at).toBeNull();
    });
  });
});
