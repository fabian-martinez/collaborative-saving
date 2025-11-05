import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmStockSubscriptionRepository } from './typeorm-stock-subscription.repository';
import { StockSubscription as StockSubscriptionEntity } from '../entities/stock-subscription.entity';
import { StockSubscription as StockSubscriptionDomain } from '@domain/entities/stock-subscription.entity';

describe('TypeOrmStockSubscriptionRepository', () => {
  let repository: TypeOrmStockSubscriptionRepository;
  let typeOrmRepo: jest.Mocked<Repository<StockSubscriptionEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStockSubscriptionRepository,
        {
          provide: getRepositoryToken(StockSubscriptionEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmStockSubscriptionRepository>(
      TypeOrmStockSubscriptionRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(StockSubscriptionEntity));
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
  });
});
