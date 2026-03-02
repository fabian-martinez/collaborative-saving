import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { TypeOrmStockRepository } from './typeorm-stock.repository';
import { Stock as StockEntity, StockBehavior } from '../entities/stock.entity';
import { Stock as StockDomain } from '@domain/entities/stock.entity';

describe('TypeOrmStockRepository', () => {
  let repository: TypeOrmStockRepository;
  let typeOrmRepo: jest.Mocked<Repository<StockEntity>>;
  let findOneSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStockRepository,
        {
          provide: getRepositoryToken(StockEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmStockRepository>(TypeOrmStockRepository);
    typeOrmRepo = module.get(getRepositoryToken(StockEntity));

    // Create spies to avoid 'this' scoping issues
    findOneSpy = jest.spyOn(typeOrmRepo, 'findOne');
    saveSpy = jest.spyOn(typeOrmRepo, 'save');
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
  });

  describe('findById', () => {
    it('should return Stock when found and not deleted', async () => {
      // Arrange
      const stockId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: StockEntity = {
        id: stockId,
        type: 'Bono',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      } as StockEntity;

      typeOrmRepo.findOne.mockResolvedValue(entity);

      // Act
      const result = await repository.findById(stockId);

      // Assert
      const findOneCall = typeOrmRepo.findOne.mock.calls[0][0];
      const where = Array.isArray(findOneCall.where)
        ? findOneCall.where[0]
        : findOneCall.where;
      expect(where?.id).toBe(stockId);
      expect(where?.deleted_at).toEqual(IsNull());
      expect(result).toBeInstanceOf(StockDomain);
      expect(result?.id).toBe(stockId);
    });

    it('should return null when not found', async () => {
      // Arrange
      const stockId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(stockId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when stock is deleted', async () => {
      // Arrange
      const stockId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(stockId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should return empty array when ids array is empty', async () => {
      const result = await repository.findByIds([]);
      expect(result).toEqual([]);
      expect(typeOrmRepo.find).not.toHaveBeenCalled();
    });

    it('should return array of stocks for given ids', async () => {
      // Arrange
      const stockIds = ['stock-1', 'stock-2'];
      const entities: StockEntity[] = [
        {
          id: 'stock-1',
          type: 'Bono',
          value: 100,
          monthly_contribution: 50,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        } as StockEntity,
        {
          id: 'stock-2',
          type: 'Super',
          value: 200,
          monthly_contribution: 100,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        } as StockEntity,
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      // Act
      const result = await repository.findByIds(stockIds);

      // Assert
      const findCall = typeOrmRepo.find.mock.calls[0]?.[0];
      expect(findCall).toBeDefined();
      if (!findCall) {
        throw new Error('findCall is undefined');
      }
      const where = Array.isArray(findCall.where)
        ? findCall.where[0]
        : findCall.where;
      expect(where?.id).toEqual(In(stockIds));
      expect(where?.deleted_at).toEqual(IsNull());
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StockDomain);
      expect(result[0].id).toBe('stock-1');
      expect(result[1].id).toBe('stock-2');
    });
  });

  describe('findByType', () => {
    it('should return Stock when found by type and not deleted', async () => {
      // Arrange
      const stockType = 'Bono';
      const entity: StockEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: stockType,
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      } as StockEntity;

      typeOrmRepo.findOne.mockResolvedValue(entity);

      // Act
      const result = await repository.findByType(stockType);

      // Assert
      const findOneCall = typeOrmRepo.findOne.mock.calls[0][0];
      const where = Array.isArray(findOneCall.where)
        ? findOneCall.where[0]
        : findOneCall.where;
      expect(where?.type).toBe(stockType);
      expect(where?.deleted_at).toEqual(IsNull());
      expect(result).toBeInstanceOf(StockDomain);
      expect(result?.type).toBe(stockType);
    });

    it('should return null when not found by type', async () => {
      // Arrange
      const stockType = 'Bono';
      typeOrmRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByType(stockType);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return array of stocks not deleted', async () => {
      // Arrange
      const entities: StockEntity[] = [
        {
          id: 'stock-1',
          type: 'Bono',
          value: 100,
          monthly_contribution: 50,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        } as StockEntity,
        {
          id: 'stock-2',
          type: 'Super',
          value: 200,
          monthly_contribution: 100,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        } as StockEntity,
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      // Act
      const result = await repository.findAll();

      // Assert
      const findCall = typeOrmRepo.find.mock.calls[0]?.[0];
      expect(findCall).toBeDefined();
      if (!findCall) {
        throw new Error('findCall is undefined');
      }
      const where = Array.isArray(findCall.where)
        ? findCall.where[0]
        : findCall.where;
      expect(where?.deleted_at).toEqual(IsNull());
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StockDomain);
      expect(result[0].id).toBe('stock-1');
      expect(result[1].id).toBe('stock-2');
    });

    it('should return empty array when no stocks found', async () => {
      // Arrange
      typeOrmRepo.find.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should return array of active stocks (same as findAll)', async () => {
      // Arrange
      const entities: StockEntity[] = [
        {
          id: 'stock-1',
          type: 'Bono',
          value: 100,
          monthly_contribution: 50,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        } as StockEntity,
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      // Act
      const result = await repository.findActive();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StockDomain);
    });
  });

  describe('save', () => {
    it('should insert new stock when not exists', async () => {
      // Arrange
      const stock = StockDomain.create({
        type: 'Bono',
        value: 100,
        monthlyContribution: 50,
      });

      const entity: StockEntity = {
        id: stock.id,
        type: stock.type,
        value: stock.value,
        monthly_contribution: stock.monthlyContribution,
        is_guaranteed: stock.isGuaranteed,
        guaranteed_yield: stock.guaranteedYield,
        behavior: stock.behavior,
        deleted_at: null,
      } as StockEntity;

      typeOrmRepo.findOne.mockResolvedValueOnce(null); // Not found
      typeOrmRepo.save.mockResolvedValue(entity);

      // Act
      const result = await repository.save(stock);

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: stock.id },
        withDeleted: true,
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toBeInstanceOf(StockDomain);
      expect(result.id).toBe(stock.id);
    });

    it('should update existing stock when exists', async () => {
      // Arrange
      const stock = StockDomain.create({
        type: 'Bono',
        value: 150,
        monthlyContribution: 75,
      });

      const existingEntity: StockEntity = {
        id: stock.id,
        type: 'Bono',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      } as StockEntity;

      const updatedEntity: StockEntity = {
        id: stock.id,
        type: 'Bono',
        value: 150,
        monthly_contribution: 75,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      } as StockEntity;

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Found existing
        .mockResolvedValueOnce(updatedEntity); // After update
      typeOrmRepo.update.mockResolvedValue(undefined as any);

      // Act
      const result = await repository.save(stock);

      // Assert
      expect(findOneSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith(stock.id, expect.any(Object));
      expect(result).toBeInstanceOf(StockDomain);
      expect(result.id).toBe(stock.id);
      expect(result.value).toBe(150);
    });

    it('should throw error when stock not found after update', async () => {
      // Arrange
      const stock = StockDomain.create({
        type: 'Bono',
        value: 100,
        monthlyContribution: 50,
      });

      const existingEntity: StockEntity = {
        id: stock.id,
        type: 'Bono',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      } as StockEntity;

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Found existing
        .mockResolvedValueOnce(null); // Not found after update
      typeOrmRepo.update.mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(repository.save(stock)).rejects.toThrow(
        'Stock not found after update',
      );
    });
  });

  describe('findGuaranteed', () => {
    it('should return array of guaranteed stocks not deleted', async () => {
      // Arrange
      const entities: StockEntity[] = [
        {
          id: 'stock-1',
          type: 'Bono',
          value: 100,
          monthly_contribution: 50,
          is_guaranteed: true,
          guaranteed_yield: 0.05,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        } as StockEntity,
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      // Act
      const result = await repository.findGuaranteed();

      // Assert
      const findCall = typeOrmRepo.find.mock.calls[0]?.[0];
      expect(findCall).toBeDefined();
      if (!findCall) {
        throw new Error('findCall is undefined');
      }
      const where = Array.isArray(findCall.where)
        ? findCall.where[0]
        : findCall.where;
      expect(where?.is_guaranteed).toBe(true);
      expect(where?.deleted_at).toEqual(IsNull());
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StockDomain);
      expect(result[0].isGuaranteed).toBe(true);
    });

    it('should return empty array when no guaranteed stocks found', async () => {
      // Arrange
      typeOrmRepo.find.mockResolvedValue([]);

      // Act
      const result = await repository.findGuaranteed();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
