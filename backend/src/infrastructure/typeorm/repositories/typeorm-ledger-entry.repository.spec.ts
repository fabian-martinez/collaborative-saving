import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmLedgerEntryRepository } from './typeorm-ledger-entry.repository';
import { LedgerEntry as LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { LedgerEntry as LedgerEntryDomain } from '@domain/entities/ledger-entry.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';

describe('TypeOrmLedgerEntryRepository', () => {
  let repository: TypeOrmLedgerEntryRepository;
  let typeOrmRepo: jest.Mocked<Repository<LedgerEntryEntity>>;

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
      ],
    }).compile();

    repository = module.get<TypeOrmLedgerEntryRepository>(
      TypeOrmLedgerEntryRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(LedgerEntryEntity));
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
      typeOrmRepo.update.mockResolvedValue(undefined as any);

      const result = await repository.save(domain);
      expect(typeOrmRepo.update).toHaveBeenCalledWith(domain.id, expect.any(Object));
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
      typeOrmRepo.update.mockResolvedValue(undefined as any);

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

      typeOrmRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

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

      mockQueryBuilder.getMany.mockResolvedValue(entities as LedgerEntryEntity[]);
      const result = await repository.findByOperations(operationIds);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LedgerEntryDomain);
    });

    it('should return empty array when operationIds is empty', async () => {
      const result = await repository.findByOperations([]);
      expect(result).toEqual([]);
      expect(typeOrmRepo.createQueryBuilder).not.toHaveBeenCalled();
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

      typeOrmRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

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

      mockQueryBuilder.getMany.mockResolvedValue(entities as LedgerEntryEntity[]);
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

      (typeOrmRepo.save as jest.Mock).mockImplementation(async (input: any) => {
        if (Array.isArray(input)) {
          return entities as LedgerEntryEntity[];
        }
        return entities[0] as LedgerEntryEntity;
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

      typeOrmRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
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

      typeOrmRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
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

      typeOrmRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await repository.sumByAccountType(accountType);
      expect(result).toBe(0);
    });
  });
});
