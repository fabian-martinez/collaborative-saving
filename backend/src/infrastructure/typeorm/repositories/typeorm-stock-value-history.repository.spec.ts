import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TypeOrmStockValueHistoryRepository } from './typeorm-stock-value-history.repository';
import { StockValueHistory as StockValueHistoryEntity } from '../entities/stock-value-history.entity';
import { StockValueHistory as StockValueHistoryDomain } from '@domain/entities/stock-value-history.entity';
import { StockValueHistory } from '@domain/entities/stock-value-history.entity';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

describe('TypeOrmStockValueHistoryRepository', () => {
  let repository: TypeOrmStockValueHistoryRepository;
  let typeOrmRepo: jest.Mocked<Repository<StockValueHistoryEntity>>;
  let mockTransactionManager: {
    execute: jest.Mock;
    getActiveQueryRunner: jest.Mock;
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockTransactionManager = {
      execute: jest.fn(),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStockValueHistoryRepository,
        {
          provide: getRepositoryToken(StockValueHistoryEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmStockValueHistoryRepository>(
      TypeOrmStockValueHistoryRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(StockValueHistoryEntity));
  });

  describe('findById', () => {
    it('should return StockValueHistory when found', async () => {
      const historyId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<StockValueHistoryEntity> = {
        id: historyId,
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
        createdAt: new Date(),
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as StockValueHistoryEntity);
      const result = await repository.findById(historyId);

      expect(result).toBeInstanceOf(StockValueHistoryDomain);
      expect(result?.id).toBe(historyId);
    });

    it('should return null when not found', async () => {
      const historyId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(historyId);

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: historyId },
      });
    });
  });

  describe('findByStock', () => {
    it('should return array of histories', async () => {
      const entities: Partial<StockValueHistoryEntity>[] = [
        {
          id: '1',
          stockId: 'stock-1',
          operationId: 'operation-1',
          previousValue: 100,
          growthFromContributions: 10,
          growthFromInterest: 5,
          totalGrowthPerShare: 15,
          newValue: 115,
          createdAt: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as StockValueHistoryEntity[]);
      const result = await repository.findByStock('stock-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StockValueHistoryDomain);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { stockId: 'stock-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no histories found', async () => {
      typeOrmRepo.find.mockResolvedValue([]);
      const result = await repository.findByStock('stock-1');
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('findByOperation', () => {
    it('should return array of histories for operation', async () => {
      const entities: Partial<StockValueHistoryEntity>[] = [
        {
          id: '1',
          stockId: 'stock-1',
          operationId: 'operation-1',
          previousValue: 100,
          growthFromContributions: 10,
          growthFromInterest: 5,
          totalGrowthPerShare: 15,
          newValue: 115,
          createdAt: new Date(),
        },
        {
          id: '2',
          stockId: 'stock-2',
          operationId: 'operation-1',
          previousValue: 200,
          growthFromContributions: 20,
          growthFromInterest: 10,
          totalGrowthPerShare: 30,
          newValue: 230,
          createdAt: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as StockValueHistoryEntity[]);
      const result = await repository.findByOperation('operation-1');
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StockValueHistoryDomain);
      expect(result[1]).toBeInstanceOf(StockValueHistoryDomain);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { operationId: 'operation-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no histories found for operation', async () => {
      typeOrmRepo.find.mockResolvedValue([]);
      const result = await repository.findByOperation('operation-1');
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('findLatestByStock', () => {
    it('should return latest StockValueHistory for stock', async () => {
      const entity: Partial<StockValueHistoryEntity> = {
        id: '1',
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
        createdAt: new Date(),
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as StockValueHistoryEntity);
      const result = await repository.findLatestByStock('stock-1');

      expect(result).toBeInstanceOf(StockValueHistoryDomain);
      expect(result?.id).toBe('1');
      expect(result?.stockId).toBe('stock-1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { stockId: 'stock-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return null when no history found for stock', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findLatestByStock('stock-1');

      expect(result).toBeNull();
    });
  });

  describe('findByStockBeforeDate', () => {
    it('should return StockValueHistory before date', async () => {
      const date = new Date('2024-01-15');
      const entity: Partial<StockValueHistoryEntity> = {
        id: '1',
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
        createdAt: new Date('2024-01-10'),
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as StockValueHistoryEntity);
      const result = await repository.findByStockBeforeDate('stock-1', date);

      expect(result).toBeInstanceOf(StockValueHistoryDomain);
      expect(result?.id).toBe('1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.findOne).toHaveBeenCalled();
    });

    it('should return null when no history found before date', async () => {
      const date = new Date('2024-01-15');
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByStockBeforeDate('stock-1', date);

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should insert new history when not exists', async () => {
      const domain = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        stockId: domain.stockId,
        operationId: domain.operationId,
        previousValue: domain.previousValue,
        growthFromContributions: domain.growthFromContributions,
        growthFromInterest: domain.growthFromInterest,
        totalGrowthPerShare: domain.totalGrowthPerShare,
        newValue: domain.newValue,
        createdAt: domain.createdAt,
      } as StockValueHistoryEntity);

      const result = await repository.save(domain);
      expect(result).toBeInstanceOf(StockValueHistoryDomain);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.save).toHaveBeenCalled();
    });

    it('should update existing history when exists', async () => {
      const domain = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });

      const existingEntity: Partial<StockValueHistoryEntity> = {
        id: domain.id,
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
        createdAt: new Date(),
      };

      const updatedEntity: Partial<StockValueHistoryEntity> = {
        ...existingEntity,
        previousValue: 115,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 130, // 115 + 10 + 5 = 130
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as StockValueHistoryEntity)
        .mockResolvedValueOnce(updatedEntity as StockValueHistoryEntity);
      typeOrmRepo.update.mockResolvedValue({} as UpdateResult);

      const result = await repository.save(domain);

      expect(result).toBeInstanceOf(StockValueHistoryDomain);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.update).toHaveBeenCalledWith(
        domain.id,
        expect.any(Object),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error when history not found after update', async () => {
      const domain = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });

      const existingEntity: Partial<StockValueHistoryEntity> = {
        id: domain.id,
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
        createdAt: new Date(),
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as StockValueHistoryEntity)
        .mockResolvedValueOnce(null);
      typeOrmRepo.update.mockResolvedValue({} as UpdateResult);

      await expect(repository.save(domain)).rejects.toThrow(
        'StockValueHistory not found after update',
      );
    });
  });

  describe('saveMany', () => {
    it('should save multiple histories', async () => {
      const domain1 = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'operation-1',
        previousValue: 100,
        growthFromContributions: 10,
        growthFromInterest: 5,
        totalGrowthPerShare: 15,
        newValue: 115,
      });

      const domain2 = StockValueHistory.create({
        stockId: 'stock-2',
        operationId: 'operation-2',
        previousValue: 200,
        growthFromContributions: 20,
        growthFromInterest: 10,
        totalGrowthPerShare: 30,
        newValue: 230,
      });

      const savedEntities: Partial<StockValueHistoryEntity>[] = [
        {
          id: domain1.id,
          stockId: domain1.stockId,
          operationId: domain1.operationId,
          previousValue: domain1.previousValue,
          growthFromContributions: domain1.growthFromContributions,
          growthFromInterest: domain1.growthFromInterest,
          totalGrowthPerShare: domain1.totalGrowthPerShare,
          newValue: domain1.newValue,
          createdAt: domain1.createdAt,
        },
        {
          id: domain2.id,
          stockId: domain2.stockId,
          operationId: domain2.operationId,
          previousValue: domain2.previousValue,
          growthFromContributions: domain2.growthFromContributions,
          growthFromInterest: domain2.growthFromInterest,
          totalGrowthPerShare: domain2.totalGrowthPerShare,
          newValue: domain2.newValue,
          createdAt: domain2.createdAt,
        },
      ];

      (typeOrmRepo.save as jest.Mock).mockImplementation((input: any) => {
        if (Array.isArray(input)) {
          return savedEntities as StockValueHistoryEntity[];
        }
        return savedEntities[0] as StockValueHistoryEntity;
      });

      const result = await repository.saveMany([domain1, domain2]);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StockValueHistoryDomain);
      expect(result[1]).toBeInstanceOf(StockValueHistoryDomain);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: domain1.id }),
          expect.objectContaining({ id: domain2.id }),
        ]),
      );
    });

    it('should return empty array when saving empty array', async () => {
      (typeOrmRepo.save as jest.Mock).mockImplementation((input: any) => {
        if (Array.isArray(input)) {
          return [];
        }
        return {} as StockValueHistoryEntity;
      });

      const result = await repository.saveMany([]);
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('transaction support', () => {
    it('should use transaction QueryRunner repository when active', async () => {
      const transactionalRepo = {
        save: jest.fn().mockResolvedValue({
          id: 'history-1',
          stockId: 'stock-1',
          operationId: 'op-1',
          previousValue: 100,
          growthFromContributions: 0,
          growthFromInterest: 0,
          totalGrowthPerShare: 0,
          newValue: 100,
          createdAt: new Date(),
        }),
        findOne: jest.fn().mockResolvedValue(null),
      };

      const getRepository = jest.fn().mockReturnValue(transactionalRepo);
      const mockQueryRunner = {
        manager: {
          getRepository,
        },
      };

      mockTransactionManager.getActiveQueryRunner.mockReturnValue(
        mockQueryRunner as any,
      );

      const history = StockValueHistory.create({
        stockId: 'stock-1',
        operationId: 'op-1',
        previousValue: 100,
        growthFromContributions: 0,
        growthFromInterest: 0,
        totalGrowthPerShare: 0,
        newValue: 100,
      });

      await repository.save(history);

      expect(getRepository).toHaveBeenCalledWith(StockValueHistoryEntity);
      expect(transactionalRepo.save).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmRepo.save).not.toHaveBeenCalled();
    });
  });
});
