import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { TypeOrmMandatoryContributionRepository } from './typeorm-mandatory-contribution.repository';
import { MandatoryContribution as MandatoryContributionEntity } from '../entities/mandatory-contribution.entity';
import { MandatoryContribution as MandatoryContributionDomain } from '@domain/entities/mandatory-contribution.entity';

describe('TypeOrmMandatoryContributionRepository', () => {
  let repository: TypeOrmMandatoryContributionRepository;
  let typeOrmRepo: jest.Mocked<Repository<MandatoryContributionEntity>>;
  let findOneSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmMandatoryContributionRepository,
        {
          provide: getRepositoryToken(MandatoryContributionEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmMandatoryContributionRepository>(
      TypeOrmMandatoryContributionRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(MandatoryContributionEntity));

    // Create spies to avoid 'this' scoping issues
    findOneSpy = jest.spyOn(typeOrmRepo, 'findOne');
    findSpy = jest.spyOn(typeOrmRepo, 'find');
    saveSpy = jest.spyOn(typeOrmRepo, 'save');
    deleteSpy = jest.spyOn(typeOrmRepo, 'delete');
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
  });

  describe('findById', () => {
    it('should return MandatoryContribution when found', async () => {
      const contributionId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: MandatoryContributionEntity = {
        id: contributionId,
        assetType: 'stock',
        value: 100,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(contributionId);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: contributionId },
      });
      expect(result).toBeInstanceOf(MandatoryContributionDomain);
      expect(result?.id).toBe(contributionId);
    });

    it('should return null when not found', async () => {
      const contributionId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(contributionId);

      expect(result).toBeNull();
    });
  });

  describe('findByAssetType', () => {
    it('should return MandatoryContribution when found by assetType', async () => {
      const entity: MandatoryContributionEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'stock',
        value: 100,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByAssetType('stock');

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { assetType: 'stock' },
      });
      expect(result).toBeInstanceOf(MandatoryContributionDomain);
      expect(result?.assetType).toBe('stock');
    });

    it('should return null when not found by assetType', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByAssetType('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return array of all contributions', async () => {
      const entities: MandatoryContributionEntity[] = [
        {
          id: '1',
          assetType: 'stock',
          value: 100,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-16'),
        },
        {
          id: '2',
          assetType: 'savings',
          value: 50,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-16'),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      const result = await repository.findAll();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MandatoryContributionDomain);
      expect(result[1]).toBeInstanceOf(MandatoryContributionDomain);
    });

    it('should return empty array when no contributions exist', async () => {
      typeOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create new contribution', async () => {
      const domain = MandatoryContributionDomain.create({
        assetType: 'stock',
        value: 100,
      });

      const entity: MandatoryContributionEntity = {
        id: domain.id,
        assetType: domain.assetType,
        value: domain.value,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      };

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue(entity);

      const result = await repository.save(domain);

      expect(saveSpy).toHaveBeenCalled();
      expect(result).toBeInstanceOf(MandatoryContributionDomain);
    });

    it('should update existing contribution', async () => {
      const domain = MandatoryContributionDomain.create({
        assetType: 'stock',
        value: 100,
      });

      const existingEntity: MandatoryContributionEntity = {
        id: domain.id,
        assetType: domain.assetType,
        value: domain.value,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      };

      typeOrmRepo.findOne.mockResolvedValueOnce(existingEntity); // First call to check existence
      typeOrmRepo.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      typeOrmRepo.findOne.mockResolvedValueOnce(existingEntity); // Second call after update

      const result = await repository.save(domain);

      expect(updateSpy).toHaveBeenCalled();
      expect(result).toBeInstanceOf(MandatoryContributionDomain);
    });
  });

  describe('delete', () => {
    it('should delete contribution successfully', async () => {
      const contributionId = '550e8400-e29b-41d4-a716-446655440000';

      typeOrmRepo.delete.mockResolvedValue({ affected: 1 } as DeleteResult);

      await repository.delete(contributionId);

      expect(deleteSpy).toHaveBeenCalledWith(contributionId);
    });
  });
});
