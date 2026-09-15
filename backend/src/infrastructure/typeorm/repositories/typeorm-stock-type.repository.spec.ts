/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmStockTypeRepository } from './typeorm-stock-type.repository';
import { StockType as StockTypeEntity } from '../entities/stock-type.entity';
import { StockType as StockTypeDomain } from '@domain/entities/stock-type.entity';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

describe('TypeOrmStockTypeRepository', () => {
  let repository: TypeOrmStockTypeRepository;
  let typeOrmRepo: jest.Mocked<Repository<StockTypeEntity>>;
  let saveSpy: jest.SpyInstance;
  let mergeSpy: jest.SpyInstance;
  let softDeleteSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(
        (existing: StockTypeEntity, update: Partial<StockTypeEntity>) =>
          ({ ...existing, ...update }) as StockTypeEntity,
      ),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStockTypeRepository,
        {
          provide: getRepositoryToken(StockTypeEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmStockTypeRepository>(
      TypeOrmStockTypeRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(StockTypeEntity));
    saveSpy = jest.spyOn(typeOrmRepo, 'save');
    mergeSpy = jest.spyOn(typeOrmRepo, 'merge');
    softDeleteSpy = jest.spyOn(typeOrmRepo, 'softDelete');
  });

  describe('findById', () => {
    it('should return StockTypeDomain when found', async () => {
      // ARRANGE
      const entity: StockTypeEntity = {
        id: 'st-1',
        code: 'ordinaria',
        name: 'Ordinaria',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        is_guaranteed: false,
        guaranteed_yield: null,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
      typeOrmRepo.findOne.mockResolvedValue(entity);

      // ACT
      const result = await repository.findById('st-1');

      // ASSERT
      expect(result).toBeInstanceOf(StockTypeDomain);
      expect(result?.code).toBe('ordinaria');
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
    it('should return StockTypeDomain when found by code', async () => {
      // ARRANGE
      const entity: StockTypeEntity = {
        id: 'st-1',
        code: 'preferencial',
        name: 'Preferencial',
        behavior: StockBehavior.DIVIDEND_YIELD,
        is_guaranteed: true,
        guaranteed_yield: 0.02,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
      typeOrmRepo.findOne.mockResolvedValue(entity);

      // ACT
      const result = await repository.findByCode('preferencial');

      // ASSERT
      expect(result).toBeInstanceOf(StockTypeDomain);
      expect(result?.code).toBe('preferencial');
      expect(result?.isGuaranteed).toBe(true);
      expect(result?.guaranteedYield).toBe(0.02);
    });

    it('should return null when not found by code', async () => {
      // ARRANGE
      typeOrmRepo.findOne.mockResolvedValue(null);

      // ACT
      const result = await repository.findByCode('non-existent');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all valid domain models', async () => {
      // ARRANGE
      const entities: StockTypeEntity[] = [
        {
          id: 'st-1',
          code: 'ordinaria',
          name: 'Ordinaria',
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          is_guaranteed: false,
          guaranteed_yield: null,
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
      expect(result[0]).toBeInstanceOf(StockTypeDomain);
      expect(result[0].code).toBe('ordinaria');
    });

    it('should skip corrupted records gracefully and log a warning', async () => {
      // ARRANGE
      const entities = [
        {
          id: 'corrupted',
          code: '',
          name: '',
        },
      ] as StockTypeEntity[];
      typeOrmRepo.find.mockResolvedValue(entities);

      // ACT
      const result = await repository.findAll();

      // ASSERT
      expect(result).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should insert new record when entity does not exist yet', async () => {
      // ARRANGE
      const domain = StockTypeDomain.create({
        name: 'Nueva Acción',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });
      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockImplementation((entity) =>
        Promise.resolve({
          ...(entity as StockTypeEntity),
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        }),
      );

      // ACT
      const saved = await repository.save(domain);

      // ASSERT
      expect(saved).toBeInstanceOf(StockTypeDomain);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should update existing record when entity is already present', async () => {
      // ARRANGE
      const domain = StockTypeDomain.create({
        name: 'Modificada',
        isGuaranteed: true,
        guaranteedYield: 0.03,
      });
      const existingEntity: StockTypeEntity = {
        id: domain.id,
        code: domain.code,
        name: 'Viejo',
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        is_guaranteed: false,
        guaranteed_yield: null,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(existingEntity);
      typeOrmRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity as StockTypeEntity),
      );

      // ACT
      const saved = await repository.save(domain);

      // ASSERT
      expect(saved).toBeInstanceOf(StockTypeDomain);
      expect(mergeSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('softDelete', () => {
    it('should soft delete existing entity', async () => {
      // ARRANGE
      typeOrmRepo.softDelete.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      // ACT & ASSERT
      await expect(repository.softDelete('st-1')).resolves.not.toThrow();
      expect(softDeleteSpy).toHaveBeenCalledWith('st-1');
    });

    it('should throw error when entity to delete is not found', async () => {
      // ARRANGE
      typeOrmRepo.softDelete.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });

      // ACT & ASSERT
      await expect(repository.softDelete('st-none')).rejects.toThrow(
        'StockType with ID st-none not found',
      );
    });
  });
});
