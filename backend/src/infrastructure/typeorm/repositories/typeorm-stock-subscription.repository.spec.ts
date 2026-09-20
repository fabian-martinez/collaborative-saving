import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TypeOrmStockSubscriptionRepository } from './typeorm-stock-subscription.repository';
import { StockSubscription as StockSubscriptionEntity } from '../entities/stock-subscription.entity';
import { StockSubscription as StockSubscriptionDomain } from '@domain/entities/stock-subscription.entity';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

describe('TypeOrmStockSubscriptionRepository', () => {
  let repository: TypeOrmStockSubscriptionRepository;
  let typeOrmRepo: jest.Mocked<Repository<StockSubscriptionEntity>>;
  let updateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionManager: TransactionManager = {
      execute: jest.fn(),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStockSubscriptionRepository,
        {
          provide: getRepositoryToken(StockSubscriptionEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmStockSubscriptionRepository>(
      TypeOrmStockSubscriptionRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(StockSubscriptionEntity));

    // Create spies to avoid 'this' scoping issues
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
  });

  describe('findById', () => {
    it('should return StockSubscription when found', async () => {
      const subscriptionId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<StockSubscriptionEntity> = {
        id: subscriptionId,
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
        status: 'active',
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as StockSubscriptionEntity);

      const result = await repository.findById(subscriptionId);

      const findOneCall = typeOrmRepo.findOne.mock.calls[0]?.[0];
      expect(findOneCall).toBeDefined();
      if (!findOneCall) return;
      const where = Array.isArray(findOneCall.where)
        ? findOneCall.where[0]
        : findOneCall.where;
      expect(where?.id).toBe(subscriptionId);
      expect(result).toBeInstanceOf(StockSubscriptionDomain);
      expect(result?.id).toBe(subscriptionId);
    });

    it('should return null when not found', async () => {
      const subscriptionId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(subscriptionId);

      expect(result).toBeNull();
    });
  });

  describe('findByMember', () => {
    it('should return array of subscriptions', async () => {
      const entities: Partial<StockSubscriptionEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          stockId: 'stock-1',
          quantity: 10,
          status: 'active',
          purchaseDate: new Date(),
          financingLoanId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as StockSubscriptionEntity[]);

      const result = await repository.findByMember('member-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StockSubscriptionDomain);
    });
  });

  describe('save', () => {
    it('should insert new subscription when not exists', async () => {
      const domain = StockSubscriptionDomain.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      const savedEntity: Partial<StockSubscriptionEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        stockId: domain.stockId,
        quantity: domain.quantity,
        status: domain.status,
        purchaseDate: domain.purchaseDate,
        financingLoanId: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue(
        savedEntity as StockSubscriptionEntity,
      );

      const result = await repository.save(domain);

      expect(typeOrmRepo.save.mock.calls.length).toBe(1);
      expect(result).toBeInstanceOf(StockSubscriptionDomain);
    });

    it('should update existing subscription when exists', async () => {
      const domain = StockSubscriptionDomain.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      const existingEntity: Partial<StockSubscriptionEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        stockId: domain.stockId,
        quantity: 5,
        status: domain.status,
        purchaseDate: domain.purchaseDate,
        financingLoanId: null,
      };

      const updatedEntity: Partial<StockSubscriptionEntity> = {
        ...existingEntity,
        quantity: 10,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as StockSubscriptionEntity)
        .mockResolvedValueOnce(updatedEntity as StockSubscriptionEntity);
      typeOrmRepo.update.mockResolvedValue(
        undefined as unknown as UpdateResult,
      );

      const result = await repository.save(domain);
      expect(updateSpy).toHaveBeenCalledWith(domain.id, expect.any(Object));
      expect(result).toBeInstanceOf(StockSubscriptionDomain);
    });

    it('should throw error when subscription not found after update', async () => {
      const domain = StockSubscriptionDomain.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      const existingEntity: Partial<StockSubscriptionEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        stockId: domain.stockId,
        quantity: 5,
        status: domain.status,
        purchaseDate: domain.purchaseDate,
        financingLoanId: null,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as StockSubscriptionEntity)
        .mockResolvedValueOnce(null);
      typeOrmRepo.update.mockResolvedValue(
        undefined as unknown as UpdateResult,
      );

      await expect(repository.save(domain)).rejects.toThrow(
        'StockSubscription not found after update',
      );
    });
  });

  describe('findByMemberAndStock', () => {
    it('should return subscription when found', async () => {
      const memberId = 'member-1';
      const stockId = 'stock-1';
      const entity: Partial<StockSubscriptionEntity> = {
        id: 'subscription-1',
        memberId,
        stockId,
        quantity: 10,
        status: 'active',
        purchaseDate: new Date(),
        financingLoanId: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as StockSubscriptionEntity);
      const result = await repository.findByMemberAndStock(memberId, stockId);

      expect(result).toBeInstanceOf(StockSubscriptionDomain);
      expect(result?.memberId).toBe(memberId);
      expect(result?.stockId).toBe(stockId);
    });

    it('should return null when not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByMemberAndStock(
        'member-1',
        'stock-1',
      );
      expect(result).toBeNull();
    });
  });

  describe('findActiveByMember', () => {
    it('should return array of active subscriptions', async () => {
      const memberId = 'member-1';
      const entities: Partial<StockSubscriptionEntity>[] = [
        {
          id: '1',
          memberId,
          stockId: 'stock-1',
          quantity: 10,
          status: 'active',
          purchaseDate: new Date(),
          financingLoanId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as StockSubscriptionEntity[]);
      const result = await repository.findActiveByMember(memberId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StockSubscriptionDomain);
      expect(result[0].status).toBe('active');
    });
  });

  describe('findFreeOfFinancing', () => {
    it('should return array of subscriptions without financing', async () => {
      const memberId = 'member-1';
      const entities: Partial<StockSubscriptionEntity>[] = [
        {
          id: '1',
          memberId,
          stockId: 'stock-1',
          quantity: 10,
          status: 'active',
          purchaseDate: new Date(),
          financingLoanId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as StockSubscriptionEntity[]);
      const result = await repository.findFreeOfFinancing(memberId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StockSubscriptionDomain);
    });
  });

  describe('findByStock', () => {
    it('should return array of subscriptions for stock', async () => {
      const stockId = 'stock-1';
      const entities: Partial<StockSubscriptionEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          stockId,
          quantity: 10,
          status: 'active',
          purchaseDate: new Date(),
          financingLoanId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as StockSubscriptionEntity[]);
      const result = await repository.findByStock(stockId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StockSubscriptionDomain);
      expect(result[0].stockId).toBe(stockId);
    });
  });

  describe('saveMany', () => {
    it('should save multiple subscriptions', async () => {
      const domain1 = StockSubscriptionDomain.create({
        memberId: 'member-1',
        stockId: 'stock-1',
        quantity: 10,
      });

      const domain2 = StockSubscriptionDomain.create({
        memberId: 'member-2',
        stockId: 'stock-1',
        quantity: 5,
      });

      const entities: Partial<StockSubscriptionEntity>[] = [
        {
          id: domain1.id,
          memberId: domain1.memberId,
          stockId: domain1.stockId,
          quantity: domain1.quantity,
          status: domain1.status,
          purchaseDate: domain1.purchaseDate,
          financingLoanId: null,
        },
        {
          id: domain2.id,
          memberId: domain2.memberId,
          stockId: domain2.stockId,
          quantity: domain2.quantity,
          status: domain2.status,
          purchaseDate: domain2.purchaseDate,
          financingLoanId: null,
        },
      ];

      (typeOrmRepo.save as jest.Mock).mockImplementation((input: unknown) => {
        if (Array.isArray(input)) {
          return Promise.resolve(entities as StockSubscriptionEntity[]);
        }
        return Promise.resolve(entities[0] as StockSubscriptionEntity);
      });
      const result = await repository.saveMany([domain1, domain2]);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StockSubscriptionDomain);
      expect(result[1]).toBeInstanceOf(StockSubscriptionDomain);
    });
  });
});
