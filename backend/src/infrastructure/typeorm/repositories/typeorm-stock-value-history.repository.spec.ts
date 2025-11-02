import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { TypeOrmStockValueHistoryRepository } from './typeorm-stock-value-history.repository';
import { StockValueHistory as StockValueHistoryEntity } from '../entities/stock-value-history.entity';
import { StockValueHistory as StockValueHistoryDomain } from '@domain/entities/stock-value-history.entity';
import { StockValueHistory } from '@domain/entities/stock-value-history.entity';

describe('TypeOrmStockValueHistoryRepository', () => {
  let repository: TypeOrmStockValueHistoryRepository;
  let typeOrmRepo: jest.Mocked<Repository<StockValueHistoryEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStockValueHistoryRepository,
        {
          provide: getRepositoryToken(StockValueHistoryEntity),
          useValue: mockTypeOrmRepo,
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
    });
  });
});

