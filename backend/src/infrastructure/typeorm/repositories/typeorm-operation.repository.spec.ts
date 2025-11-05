import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmOperationRepository } from './typeorm-operation.repository';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { Operation as OperationDomain } from '@domain/entities/operation.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { OperationType } from '@domain/enums/operation-type.enum';

describe('TypeOrmOperationRepository', () => {
  let repository: TypeOrmOperationRepository;
  let typeOrmRepo: jest.Mocked<Repository<OperationEntity>>;
  let ledgerEntryRepo: jest.Mocked<LedgerEntryRepository>;
  let findSpy: jest.SpyInstance;

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
  });
});
