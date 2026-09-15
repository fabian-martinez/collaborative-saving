/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmLoanTypeRepository } from './typeorm-loan-type.repository';
import { LoanType as LoanTypeEntity } from '../entities/loan-type.entity';
import { LoanType as LoanTypeDomain } from '@domain/entities/loan-type.entity';

describe('TypeOrmLoanTypeRepository', () => {
  let repository: TypeOrmLoanTypeRepository;
  let typeOrmRepo: jest.Mocked<Repository<LoanTypeEntity>>;
  let saveSpy: jest.SpyInstance;
  let mergeSpy: jest.SpyInstance;
  let softDeleteSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(
        (existing: LoanTypeEntity, update: Partial<LoanTypeEntity>) =>
          ({ ...existing, ...update }) as LoanTypeEntity,
      ),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmLoanTypeRepository,
        {
          provide: getRepositoryToken(LoanTypeEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmLoanTypeRepository>(
      TypeOrmLoanTypeRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(LoanTypeEntity));
    saveSpy = jest.spyOn(typeOrmRepo, 'save');
    mergeSpy = jest.spyOn(typeOrmRepo, 'merge');
    softDeleteSpy = jest.spyOn(typeOrmRepo, 'softDelete');
  });

  describe('findById', () => {
    it('should return LoanTypeDomain when found', async () => {
      // ARRANGE
      const entity: LoanTypeEntity = {
        id: 'lt-1',
        code: 'corriente',
        name: 'Corriente',
        interest_rate: 0.015,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
      typeOrmRepo.findOne.mockResolvedValue(entity);

      // ACT
      const result = await repository.findById('lt-1');

      // ASSERT
      expect(result).toBeInstanceOf(LoanTypeDomain);
      expect(result?.code).toBe('corriente');
    });

    it('should return null when not found', async () => {
      // ARRANGE
      typeOrmRepo.findOne.mockResolvedValue(null);

      // ACT
      const result = await repository.findById('non-existent');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should return LoanTypeDomain when found by code', async () => {
      // ARRANGE
      const entity: LoanTypeEntity = {
        id: 'lt-1',
        code: 'agil',
        name: 'Ágil',
        interest_rate: 0.02,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
      typeOrmRepo.findOne.mockResolvedValue(entity);

      // ACT
      const result = await repository.findByCode('agil');

      // ASSERT
      expect(result).toBeInstanceOf(LoanTypeDomain);
      expect(result?.name).toBe('Ágil');
    });

    it('should return null when code not found', async () => {
      // ARRANGE
      typeOrmRepo.findOne.mockResolvedValue(null);

      // ACT
      const result = await repository.findByCode('non-existent');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all valid loan types', async () => {
      // ARRANGE
      const entities: LoanTypeEntity[] = [
        {
          id: 'lt-1',
          code: 'corriente',
          name: 'Corriente',
          interest_rate: 0.015,
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      ];
      typeOrmRepo.find.mockResolvedValue(entities);

      // ACT
      const result = await repository.findAll();

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('corriente');
    });

    it('should skip invalid entities and log warning', async () => {
      // ARRANGE
      const entities = [
        {
          id: '',
          code: '',
          name: '',
          interest_rate: -1,
        } as unknown as LoanTypeEntity,
      ];
      typeOrmRepo.find.mockResolvedValue(entities);

      // ACT
      const result = await repository.findAll();

      // ASSERT
      expect(result).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should insert new loan type when it does not exist in DB', async () => {
      // ARRANGE
      const domain = LoanTypeDomain.create({
        name: 'Nuevo',
        interestRate: 0.015,
      });
      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity as LoanTypeEntity),
      );

      // ACT
      const result = await repository.save(domain);

      // ASSERT
      expect(result).toBeInstanceOf(LoanTypeDomain);
      expect(result.code).toBe(domain.code);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should update existing loan type when already in DB', async () => {
      // ARRANGE
      const domain = LoanTypeDomain.create({
        name: 'Modificado',
        interestRate: 0.02,
      });
      const existingEntity: LoanTypeEntity = {
        id: domain.id,
        code: domain.code,
        name: 'Anterior',
        interest_rate: 0.015,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
      typeOrmRepo.findOne.mockResolvedValue(existingEntity);
      typeOrmRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity as LoanTypeEntity),
      );

      // ACT
      const result = await repository.save(domain);

      // ASSERT
      expect(result).toBeInstanceOf(LoanTypeDomain);
      expect(mergeSpy).toHaveBeenCalledWith(existingEntity, expect.anything());
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('softDelete', () => {
    it('should soft delete successfully when record exists', async () => {
      // ARRANGE
      typeOrmRepo.softDelete.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      // ACT & ASSERT
      await expect(repository.softDelete('lt-1')).resolves.not.toThrow();
      expect(softDeleteSpy).toHaveBeenCalledWith('lt-1');
    });

    it('should throw error when record is not found (affected is 0)', async () => {
      // ARRANGE
      typeOrmRepo.softDelete.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });

      // ACT & ASSERT
      await expect(repository.softDelete('non-existent')).rejects.toThrow(
        'LoanType with ID non-existent not found',
      );
    });
  });
});
