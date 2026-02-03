import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmOperationRepository } from './typeorm-operation.repository';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { Operation as OperationDomain } from '@domain/entities/operation.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { OperationType } from '@domain/enums/operation-type.enum';
import { CASH_ACCOUNT, AccountType } from '@domain/constants/account-types';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';

describe('TypeOrmOperationRepository', () => {
  let repository: TypeOrmOperationRepository;
  let typeOrmRepo: jest.Mocked<Repository<OperationEntity>>;
  let ledgerEntryRepo: jest.Mocked<LedgerEntryRepository>;
  let findSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;
  let saveManySpy: jest.SpyInstance;
  let createQueryBuilderSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockLedgerEntryRepo = {
      saveMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmOperationRepository,
        {
          provide: getRepositoryToken(OperationEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: 'LedgerEntryRepository',
          useValue: mockLedgerEntryRepo,
        },
        {
          provide: TransactionManager,
          useValue: {
            execute: jest.fn(),
            getActiveQueryRunner: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    repository = module.get<TypeOrmOperationRepository>(
      TypeOrmOperationRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(OperationEntity));
    ledgerEntryRepo = module.get('LedgerEntryRepository');
    repository.setLedgerEntryRepository(ledgerEntryRepo);

    // Create spies to avoid 'this' scoping issues
    findSpy = jest.spyOn(typeOrmRepo, 'find');
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
    saveManySpy = jest.spyOn(ledgerEntryRepo, 'saveMany');
    createQueryBuilderSpy = jest.spyOn(typeOrmRepo, 'createQueryBuilder');
  });

  describe('findById', () => {
    it('should return Operation when found', async () => {
      const operationId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<OperationEntity> = {
        id: operationId,
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date(),
        description: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as OperationEntity);
      const result = await repository.findById(operationId);

      expect(result).toBeInstanceOf(OperationDomain);
      expect(result?.id).toBe(operationId);
    });
  });

  describe('findByMeeting', () => {
    it('should return operations for meeting', async () => {
      const meetingId = 'meeting-123';
      const entities: Partial<OperationEntity>[] = [
        {
          id: 'op-1',
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as OperationEntity[]);
      const result = await repository.findByMeeting(meetingId);

      expect(findSpy).toHaveBeenCalledWith({ where: { meetingId } });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(OperationDomain);
    });
  });

  describe('findByMeetingAndType', () => {
    it('should return operations for meeting and type', async () => {
      // ARRANGE
      const meetingId = 'meeting-123';
      const type = OperationType.MONTHLY_PAYMENT;
      const entities: Partial<OperationEntity>[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type,
          date: new Date('2024-01-15'),
          description: 'Payment 1',
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          meetingId,
          type,
          date: new Date('2024-01-15'),
          description: 'Payment 2',
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as OperationEntity[]);

      // ACT
      const result = await repository.findByMeetingAndType(meetingId, type);

      // ASSERT
      expect(findSpy).toHaveBeenCalledWith({
        where: { meetingId, type },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(OperationDomain);
      expect(result[0].id).toBe('op-1');
      expect(result[0].type).toBe(type);
      expect(result[1]).toBeInstanceOf(OperationDomain);
      expect(result[1].id).toBe('op-2');
    });

    it('should return empty array when no operations found', async () => {
      // ARRANGE
      const meetingId = 'meeting-123';
      const type = OperationType.MONTHLY_PAYMENT;
      typeOrmRepo.find.mockResolvedValue([]);

      // ACT
      const result = await repository.findByMeetingAndType(meetingId, type);

      // ASSERT
      expect(findSpy).toHaveBeenCalledWith({
        where: { meetingId, type },
      });
      expect(result).toEqual([]);
    });

    it('should filter by both meetingId and type correctly', async () => {
      // ARRANGE
      const meetingId = 'meeting-123';
      const type = OperationType.MONTHLY_PAYMENT;
      const entities: Partial<OperationEntity>[] = [
        {
          id: 'op-1',
          meetingId,
          type,
          date: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as OperationEntity[]);

      // ACT
      const result = await repository.findByMeetingAndType(meetingId, type);

      // ASSERT
      expect(findSpy).toHaveBeenCalledWith({
        where: { meetingId, type },
      });
      expect(result).toHaveLength(1);
      expect(result[0].meetingId).toBe(meetingId);
      expect(result[0].type).toBe(type);
    });
  });

  describe('findByMeetingAndTypes', () => {
    it('should return operations of multiple types for a meeting', async () => {
      // ARRANGE
      const meetingId = 'meeting-123';
      const types = [
        OperationType.MONTHLY_PAYMENT,
        OperationType.LOAN_PAYMENT,
        OperationType.MANDATORY_CONTRIBUTION,
      ];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const entities: Partial<OperationEntity>[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Monthly payment',
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          meetingId,
          type: OperationType.LOAN_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Loan payment',
        },
        {
          id: 'op-3',
          memberId: 'member-1',
          meetingId,
          type: OperationType.MANDATORY_CONTRIBUTION,
          date: new Date('2024-01-15'),
          description: 'Mandatory contribution',
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(entities as OperationEntity[]);

      // ACT
      const result = await repository.findByMeetingAndTypes(meetingId, types);

      // ASSERT
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'operation.meeting_id = :meetingId',
        { meetingId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.type IN (:...types)',
        { types },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'operation.date',
        'DESC',
      );
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(OperationDomain);
      expect(result[0].type).toBe(OperationType.MONTHLY_PAYMENT);
      expect(result[1].type).toBe(OperationType.LOAN_PAYMENT);
      expect(result[2].type).toBe(OperationType.MANDATORY_CONTRIBUTION);
    });

    it('should return empty array when no operations found', async () => {
      // ARRANGE
      const meetingId = 'meeting-123';
      const types = [OperationType.MONTHLY_PAYMENT, OperationType.LOAN_PAYMENT];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // ACT
      const result = await repository.findByMeetingAndTypes(meetingId, types);

      // ASSERT
      expect(result).toEqual([]);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should filter correctly by meetingId and multiple types using IN clause', async () => {
      // ARRANGE
      const meetingId = 'meeting-123';
      const types = [
        OperationType.MONTHLY_PAYMENT,
        OperationType.STOCK_FEE,
        OperationType.FEE,
      ];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const entities: Partial<OperationEntity>[] = [
        {
          id: 'op-1',
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date(),
        },
        {
          id: 'op-2',
          meetingId,
          type: OperationType.STOCK_FEE,
          date: new Date(),
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(entities as OperationEntity[]);

      // ACT
      const result = await repository.findByMeetingAndTypes(meetingId, types);

      // ASSERT
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'operation.meeting_id = :meetingId',
        { meetingId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.type IN (:...types)',
        { types },
      );
      expect(result).toHaveLength(2);
      expect(result[0].meetingId).toBe(meetingId);
      expect(result[1].meetingId).toBe(meetingId);
      expect(types).toContain(result[0].type);
      expect(types).toContain(result[1].type);
    });

    it('should return empty array when types array is empty', async () => {
      // ARRANGE
      const meetingId = 'meeting-123';
      const types: OperationType[] = [];

      // ACT
      const result = await repository.findByMeetingAndTypes(meetingId, types);

      // ASSERT
      expect(result).toEqual([]);
      expect(createQueryBuilderSpy).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should insert new operation when not exists', async () => {
      const domain = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        date: domain.date,
        description: domain.description,
      } as OperationEntity);

      const result = await repository.save(domain);
      expect(result).toBeInstanceOf(OperationDomain);
    });

    it('should update existing operation when exists', async () => {
      const domain = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      const existingEntity: Partial<OperationEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        date: domain.date,
        description: domain.description,
      };

      const updatedEntity: Partial<OperationEntity> = {
        ...existingEntity,
        description: 'Updated description',
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as OperationEntity)
        .mockResolvedValueOnce(updatedEntity as OperationEntity);
      updateSpy.mockResolvedValue(undefined as any);

      const result = await repository.save(domain);
      expect(updateSpy).toHaveBeenCalledWith(domain.id, expect.any(Object));
      expect(result).toBeInstanceOf(OperationDomain);
    });

    it('should throw error when operation not found after update', async () => {
      const domain = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      const existingEntity: Partial<OperationEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        date: domain.date,
        description: domain.description,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as OperationEntity)
        .mockResolvedValueOnce(null);
      updateSpy.mockResolvedValue(undefined as any);

      await expect(repository.save(domain)).rejects.toThrow(
        'Operation not found after update',
      );
    });
  });

  describe('findByMember', () => {
    it('should return operations for member without filters', async () => {
      const memberId = 'member-1';
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const entities: Partial<OperationEntity>[] = [
        {
          id: 'op-1',
          memberId,
          meetingId: 'meeting-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date(),
          description: null,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(entities as OperationEntity[]);
      const result = await repository.findByMember(memberId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(OperationDomain);
      expect(result[0].memberId).toBe(memberId);
    });

    it('should filter by meetingId when provided', async () => {
      const memberId = 'member-1';
      const meetingId = 'meeting-1';
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findByMember(memberId, { meetingId });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.meeting_id = :meetingId',
        { meetingId },
      );
    });

    it('should filter by types when provided', async () => {
      const memberId = 'member-1';
      const types = [
        OperationType.MONTHLY_PAYMENT,
        OperationType.STOCK_PURCHASE,
      ];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findByMember(memberId, { types });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.type IN (:...types)',
        { types },
      );
    });

    it('should not filter by types when empty array provided', async () => {
      const memberId = 'member-1';
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      typeOrmRepo.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findByMember(memberId, { types: [] });

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('type IN'),
        expect.any(Object),
      );
    });
  });

  describe('saveWithEntries', () => {
    it('should save operation with ledger entries', async () => {
      const domain = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      const entries: Array<{
        accountType: AccountType;
        amount: number;
        description: string;
      }> = [
        {
          accountType: CASH_ACCOUNT,
          amount: 1000,
          description: 'Test entry',
        },
      ];

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        date: domain.date,
        description: domain.description,
      } as OperationEntity);
      ledgerEntryRepo.saveMany.mockResolvedValue([]);

      const result = await repository.saveWithEntries(domain, entries);

      expect(result).toBeInstanceOf(OperationDomain);
      expect(saveManySpy).toHaveBeenCalled();
    });

    it('should throw error when LedgerEntryRepository not set', async () => {
      const repositoryWithoutLedger = new TypeOrmOperationRepository(
        typeOrmRepo as any,
        {
          execute: jest.fn(),
          getActiveQueryRunner: jest.fn().mockReturnValue(null),
        } as any,
      );
      const domain = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      // Mock save to return a complete entity
      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        date: domain.date,
        description: domain.description,
      } as unknown as OperationEntity);

      await expect(
        repositoryWithoutLedger.saveWithEntries(domain, []),
      ).rejects.toThrow('LedgerEntryRepository not set');
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated operations without filters', async () => {
      const mockQueryBuilder = {
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

      const entities: Partial<OperationEntity>[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId: 'meeting-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: null,
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          meetingId: 'meeting-1',
          type: OperationType.STOCK_PURCHASE,
          date: new Date('2024-01-16'),
          description: null,
        },
      ];

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(entities as OperationEntity[]);

      const result = await repository.findWithPagination(
        {},
        { page: 1, limit: 10 },
        'DESC',
      );

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]).toBeInstanceOf(OperationDomain);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'operation.date',
        'DESC',
      );
    });

    it('should filter by memberId', async () => {
      const memberId = 'member-1';
      const mockQueryBuilder = {
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

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.member_id = :memberId',
        { memberId },
      );
    });

    it('should filter by meetingId', async () => {
      const meetingId = 'meeting-1';
      const mockQueryBuilder = {
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
        { meetingId },
        { page: 1, limit: 10 },
        'DESC',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.meeting_id = :meetingId',
        { meetingId },
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockQueryBuilder = {
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
        'operation.date >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.date <= :endDate',
        { endDate },
      );
    });

    it('should filter by operation type', async () => {
      const type = OperationType.MONTHLY_PAYMENT;
      const mockQueryBuilder = {
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
        { type },
        { page: 1, limit: 10 },
        'DESC',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'operation.type = :type',
        { type },
      );
    });

    it('should apply pagination correctly', async () => {
      const mockQueryBuilder = {
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

      await repository.findWithPagination({}, { page: 2, limit: 10 }, 'ASC');

      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (2-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'operation.date',
        'ASC',
      );
    });
  });
});
