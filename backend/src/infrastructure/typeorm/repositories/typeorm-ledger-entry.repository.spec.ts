import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmLedgerEntryRepository } from './typeorm-ledger-entry.repository';
import { LedgerEntry as LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { LedgerEntry as LedgerEntryDomain } from '@domain/entities/ledger-entry.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

describe('TypeOrmLedgerEntryRepository', () => {
  let repository: TypeOrmLedgerEntryRepository;
  let typeOrmRepo: jest.Mocked<Repository<LedgerEntryEntity>>;
  let updateSpy: jest.SpyInstance;
  let createQueryBuilderSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockOperationRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockTransactionManager = {
      execute: jest.fn(),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmLedgerEntryRepository,
        {
          provide: getRepositoryToken(LedgerEntryEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: getRepositoryToken(OperationEntity),
          useValue: mockOperationRepo,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmLedgerEntryRepository>(
      TypeOrmLedgerEntryRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(LedgerEntryEntity));

    // Create spies to avoid 'this' scoping issues
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
    createQueryBuilderSpy = jest.spyOn(typeOrmRepo, 'createQueryBuilder');
  });

  describe('findById', () => {
    it('should return LedgerEntry when found', async () => {
      const entryId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<LedgerEntryEntity> = {
        id: entryId,
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
        description: null,
        createdAt: new Date(),
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as LedgerEntryEntity);
      const result = await repository.findById(entryId);

      expect(result).toBeInstanceOf(LedgerEntryDomain);
      expect(result?.id).toBe(entryId);
    });
  });

  describe('findByOperation', () => {
    it('should return array of ledger entries', async () => {
      const entities: Partial<LedgerEntryEntity>[] = [
        {
          id: '1',
          operationId: 'operation-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
          createdAt: new Date(),
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LedgerEntryEntity[]);
      const result = await repository.findByOperation('operation-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LedgerEntryDomain);
    });
  });

  describe('save', () => {
    it('should insert new entry when not exists', async () => {
      const domain = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      });

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        operationId: domain.operationId,
        accountType: domain.accountType,
        amount: domain.amount,
        createdAt: domain.createdAt,
        description: null,
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      } as LedgerEntryEntity);

      const result = await repository.save(domain);
      expect(result).toBeInstanceOf(LedgerEntryDomain);
    });

    it('should update existing entry when exists', async () => {
      const domain = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      });

      const existingEntity: Partial<LedgerEntryEntity> = {
        id: domain.id,
        operationId: domain.operationId,
        accountType: domain.accountType,
        amount: 500,
        createdAt: domain.createdAt,
        description: null,
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      };

      const updatedEntity: Partial<LedgerEntryEntity> = {
        ...existingEntity,
        amount: 1000,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as LedgerEntryEntity)
        .mockResolvedValueOnce(updatedEntity as LedgerEntryEntity);
      updateSpy.mockResolvedValue(undefined as any);

      const result = await repository.save(domain);
      expect(updateSpy).toHaveBeenCalledWith(domain.id, expect.any(Object));
      expect(result).toBeInstanceOf(LedgerEntryDomain);
    });

    it('should throw error when entry not found after update', async () => {
      const domain = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      });

      const existingEntity: Partial<LedgerEntryEntity> = {
        id: domain.id,
        operationId: domain.operationId,
        accountType: domain.accountType,
        amount: 500,
        createdAt: domain.createdAt,
        description: null,
        loanId: null,
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as LedgerEntryEntity)
        .mockResolvedValueOnce(null);
      updateSpy.mockResolvedValue(undefined as any);

      await expect(repository.save(domain)).rejects.toThrow(
        'LedgerEntry not found after update',
      );
    });
  });

  describe('findByOperations', () => {
    it('should return array of ledger entries for multiple operations', async () => {
      const operationIds = ['operation-1', 'operation-2'];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const entities: Partial<LedgerEntryEntity>[] = [
        {
          id: '1',
          operationId: 'operation-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
          createdAt: new Date(),
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(entities);
      const result = await repository.findByOperations(operationIds);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LedgerEntryDomain);
    });

    it('should return empty array when operationIds is empty', async () => {
      const result = await repository.findByOperations([]);
      expect(result).toEqual([]);
      expect(createQueryBuilderSpy).not.toHaveBeenCalled();
    });
  });

  describe('findByMeeting', () => {
    it('should return array of ledger entries for meeting', async () => {
      const meetingId = 'meeting-1';
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const entities: Partial<LedgerEntryEntity>[] = [
        {
          id: '1',
          operationId: 'operation-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
          createdAt: new Date(),
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(entities);
      const result = await repository.findByMeeting(meetingId);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LedgerEntryDomain);
    });
  });

  describe('findByAccountType', () => {
    it('should return array of ledger entries for account type', async () => {
      const accountType = CASH_ACCOUNT;
      const entities: Partial<LedgerEntryEntity>[] = [
        {
          id: '1',
          operationId: 'operation-1',
          accountType,
          amount: 1000,
          createdAt: new Date(),
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LedgerEntryEntity[]);
      const result = await repository.findByAccountType(accountType);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LedgerEntryDomain);
      expect(result[0].accountType).toBe(accountType);
    });
  });

  describe('saveMany', () => {
    it('should save multiple entries', async () => {
      const domain1 = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      });

      const domain2 = LedgerEntry.create({
        operationId: 'operation-2',
        accountType: CASH_ACCOUNT,
        amount: 500,
      });

      const entities: Partial<LedgerEntryEntity>[] = [
        {
          id: domain1.id,
          operationId: domain1.operationId,
          accountType: domain1.accountType,
          amount: domain1.amount,
          createdAt: domain1.createdAt,
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
        {
          id: domain2.id,
          operationId: domain2.operationId,
          accountType: domain2.accountType,
          amount: domain2.amount,
          createdAt: domain2.createdAt,
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
      ];

      (typeOrmRepo.save as jest.Mock).mockImplementation((input: any) => {
        if (Array.isArray(input)) {
          return Promise.resolve(entities as LedgerEntryEntity[]);
        }
        return Promise.resolve(entities[0] as LedgerEntryEntity);
      });
      const result = await repository.saveMany([domain1, domain2]);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(LedgerEntryDomain);
      expect(result[1]).toBeInstanceOf(LedgerEntryDomain);
    });
  });

  describe('sumByAccountType', () => {
    it('should return sum of amounts for account type', async () => {
      const accountType = CASH_ACCOUNT;
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({ sum: '1500' });

      const result = await repository.sumByAccountType(accountType);
      expect(result).toBe(1500);
    });

    it('should return 0 when sum is null', async () => {
      const accountType = CASH_ACCOUNT;
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({ sum: null });

      const result = await repository.sumByAccountType(accountType);
      expect(result).toBe(0);
    });

    it('should return 0 when result is null', async () => {
      const accountType = CASH_ACCOUNT;
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await repository.sumByAccountType(accountType);
      expect(result).toBe(0);
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated ledger entries without filters', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const entities: Partial<LedgerEntryEntity>[] = [
        {
          id: 'entry-1',
          operationId: 'operation-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
          createdAt: new Date('2024-01-15'),
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
        {
          id: 'entry-2',
          operationId: 'operation-2',
          accountType: CASH_ACCOUNT,
          amount: 2000,
          createdAt: new Date('2024-01-16'),
          description: null,
          loanId: null,
          stockId: null,
          mandatoryContributionId: null,
          stockSubscriptionId: null,
        },
      ];

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(entities);

      const result = await repository.findWithPagination(
        {},
        { page: 1, limit: 10 },
        'DESC',
      );

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]).toBeInstanceOf(LedgerEntryDomain);
      // leftJoin should NOT be called when there's no memberId filter
      expect(mockQueryBuilder.leftJoin).not.toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'ledger_entry.created_at',
        'DESC',
      );
    });

    it('should filter by memberId via join', async () => {
      const memberId = 'member-1';
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findWithPagination(
        { memberId },
        { page: 1, limit: 10 },
        'DESC',
      );

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        OperationEntity,
        'operation',
        'operation.id = ledger_entry.operation_id',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.member_id = :memberId',
        { memberId },
      );
    });

    it('should filter by accountType', async () => {
      const accountType = CASH_ACCOUNT;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findWithPagination(
        { accountType },
        { page: 1, limit: 10 },
        'DESC',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ledger_entry.account_type = :accountType',
        { accountType },
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findWithPagination(
        { startDate, endDate },
        { page: 1, limit: 10 },
        'DESC',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ledger_entry.created_at >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ledger_entry.created_at <= :endDate',
        { endDate },
      );
    });

    it('should apply pagination correctly', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getCount.mockResolvedValue(25);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findWithPagination({}, { page: 3, limit: 5 }, 'ASC');

      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'ledger_entry.created_at',
        'ASC',
      );
    });
  });
});
