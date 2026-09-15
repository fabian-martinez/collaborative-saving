import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { TypeOrmStockRepository } from './typeorm-stock.repository';
import { Stock as StockEntity, StockBehavior } from '../entities/stock.entity';
import { Stock as StockDomain } from '@domain/entities/stock.entity';

describe('TypeOrmStockRepository', () => {
  let repository: TypeOrmStockRepository;
  let typeOrmRepo: jest.Mocked<Repository<StockEntity>>;
  let saveSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
  let findOneSpy: jest.SpyInstance;
  let mergeSpy: jest.SpyInstance;
  let countSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      merge: jest.fn(
        (
          entity: StockEntity,
          ...partials: Partial<StockEntity>[]
        ): StockEntity => {
          Object.assign(entity, ...partials);
          return entity;
        },
      ),
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
    saveSpy = jest.spyOn(typeOrmRepo, 'save');
    findSpy = jest.spyOn(typeOrmRepo, 'find');
    findOneSpy = jest.spyOn(typeOrmRepo, 'findOne');
    mergeSpy = jest.spyOn(typeOrmRepo, 'merge');
    countSpy = jest.spyOn(typeOrmRepo, 'count');
  });

  describe('findByIds', () => {
    it('should return array of Stocks when found', async () => {
      const stockId1 = '550e8400-e29b-41d4-a716-446655440001';
      const stockId2 = '550e8400-e29b-41d4-a716-446655440002';
      const entity1: StockEntity = {
        id: stockId1,
        type: 'Bono',
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      };
      const entity2: StockEntity = {
        id: stockId2,
        type: 'Acción',
        value: 200,
        monthly_contribution: 100,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      };

      findSpy.mockResolvedValue([entity1, entity2]);

      const result = await repository.findByIds([stockId1, stockId2]);

      expect(findSpy).toHaveBeenCalledWith({
        where: { id: In([stockId1, stockId2]), deleted_at: IsNull() },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(stockId1);
      expect(result[1].id).toBe(stockId2);
    });

    it('should return empty array if ids is empty', async () => {
      const result = await repository.findByIds([] as string[]);
      expect(result).toEqual([]);
      expect(findSpy).not.toHaveBeenCalled();
    });
  });

  describe('saveMany', () => {
    it('should save multiple stocks and merge updates correctly', async () => {
      const domain1 = StockDomain.create({
        type: 'Bono',
        value: 100,
        monthlyContribution: 50,
        isGuaranteed: false,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });
      const domain2 = StockDomain.create({
        type: 'Acción',
        value: 200,
        monthlyContribution: 100,
        isGuaranteed: false,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const existingEntity: StockEntity = {
        id: domain1.id,
        type: 'Bono',
        value: 50,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      };

      findSpy.mockResolvedValue([existingEntity]);
      // Mock merge avoiding undefined objects
      mergeSpy.mockImplementation(
        (entity: StockEntity, ...dto: Partial<StockEntity>[]): StockEntity => {
          return Object.assign(entity || {}, ...dto) as StockEntity;
        },
      );
      saveSpy.mockResolvedValue([
        { ...existingEntity, value: 100 },
        {
          id: domain2.id,
          type: 'Acción',
          value: 200,
          monthly_contribution: 100,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        },
      ] as StockEntity[]);

      const result: StockDomain[] = await repository.saveMany([
        domain1,
        domain2,
      ]);

      expect(findSpy).toHaveBeenCalledWith({
        where: { id: In([domain1.id, domain2.id]) },
        withDeleted: true,
      });
      expect(mergeSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(100);
      expect(result[1].value).toBe(200);
    });

    it('should return empty array if no stocks to save', async () => {
      const result = await repository.saveMany([] as StockDomain[]);
      expect(result).toEqual([]);
    });
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
      };

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
      const result = await repository.findByIds([] as string[]);
      expect(result).toEqual([]);
      expect(findSpy).not.toHaveBeenCalled();
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
        },
        {
          id: 'stock-2',
          type: 'Super',
          value: 200,
          monthly_contribution: 100,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        },
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
      };

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

  describe('findByName', () => {
    it('should return Stock when found by name', async () => {
      const stockName = 'Acción Ordinaria';
      const entity: StockEntity = {
        id: 'stock-123',
        name: stockName,
        type: stockName,
        value: 100,
        monthly_contribution: 50,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      };

      findOneSpy.mockResolvedValue(entity);

      const result = await repository.findByName(stockName);

      expect(findOneSpy).toHaveBeenCalled();
      expect(result).toBeInstanceOf(StockDomain);
      expect(result?.name).toBe(stockName);
    });
  });

  describe('softDelete', () => {
    it('should call typeOrmRepo.softDelete with id', async () => {
      const softDeleteSpy = jest
        .spyOn(typeOrmRepo, 'softDelete')
        .mockResolvedValue({ generatedMaps: [], raw: [] });

      await repository.softDelete('stock-123');

      expect(softDeleteSpy).toHaveBeenCalledWith('stock-123');
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
        },
        {
          id: 'stock-2',
          type: 'Super',
          value: 200,
          monthly_contribution: 100,
          is_guaranteed: false,
          guaranteed_yield: null,
          behavior: StockBehavior.CAPITAL_APPRECIATION,
          deleted_at: null,
        },
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
        },
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
    it('should save stock (insert/update)', async () => {
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
      };

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
      };

      const updatedEntity: StockEntity = {
        id: stock.id,
        type: 'Bono',
        value: 150,
        monthly_contribution: 75,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        deleted_at: null,
      };

      typeOrmRepo.findOne.mockResolvedValueOnce(existingEntity); // Found existing
      typeOrmRepo.save.mockResolvedValue(updatedEntity); // Return updated

      // Act
      const result = await repository.save(stock);

      // Assert
      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(StockDomain);
      expect(result.id).toBe(stock.id);
      expect(result.value).toBe(150);
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
        },
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

  describe('hasActiveStocksByType', () => {
    it('should return true when count of active stocks with given type is greater than 0', async () => {
      // Arrange
      typeOrmRepo.count.mockResolvedValue(2);

      // Act
      const result = await repository.hasActiveStocksByType('ordinaria');

      // Assert
      expect(result).toBe(true);
      expect(countSpy).toHaveBeenCalledWith({
        where: {
          type: 'ordinaria',
          deleted_at: IsNull(),
        },
      });
    });

    it('should return false when no active stocks with given type exist', async () => {
      // Arrange
      typeOrmRepo.count.mockResolvedValue(0);

      // Act
      const result = await repository.hasActiveStocksByType('inexistente');

      // Assert
      expect(result).toBe(false);
    });

    it('should check stock_type_id when stockType is a valid UUID', async () => {
      // Arrange
      const uuid = 'e1a1b1c1-1111-4444-9999-000000000001';
      typeOrmRepo.count.mockResolvedValue(1);

      // Act
      const result = await repository.hasActiveStocksByType(uuid);

      // Assert
      expect(result).toBe(true);
      expect(countSpy).toHaveBeenCalledWith({
        where: [
          { type: uuid, deleted_at: IsNull() },
          { stock_type_id: uuid, deleted_at: IsNull() },
        ],
      });
    });

    it('should check ILike pattern with spaces when stockType has underscores', async () => {
      // Arrange
      typeOrmRepo.count.mockResolvedValue(1);

      // Act
      const result = await repository.hasActiveStocksByType('acciones_grandes');

      // Assert
      expect(result).toBe(true);
      expect(countSpy).toHaveBeenCalled();
    });

    it('should check cdt wildcard ILike pattern when stockType is cdt', async () => {
      // Arrange
      typeOrmRepo.count.mockResolvedValue(1);

      // Act
      const result = await repository.hasActiveStocksByType('cdt');

      // Assert
      expect(result).toBe(true);
      expect(countSpy).toHaveBeenCalled();
    });
  });
});
