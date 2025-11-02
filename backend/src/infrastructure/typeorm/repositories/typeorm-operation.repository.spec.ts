import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmOperationRepository } from './typeorm-operation.repository';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { Operation as OperationDomain } from '@domain/entities/operation.entity';
import { Operation } from '@domain/entities/operation.entity';
import { TypeOrmLedgerEntryRepository } from './typeorm-ledger-entry.repository';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';

describe('TypeOrmOperationRepository', () => {
  let repository: TypeOrmOperationRepository;
  let typeOrmRepo: jest.Mocked<Repository<OperationEntity>>;
  let ledgerEntryRepo: jest.Mocked<LedgerEntryRepository>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
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
  });

  describe('findById', () => {
    it('should return Operation when found', async () => {
      const operationId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<OperationEntity> = {
        id: operationId,
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: 'MONTHLY_PAYMENT',
        date: new Date(),
        description: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as OperationEntity);
      const result = await repository.findById(operationId);

      expect(result).toBeInstanceOf(OperationDomain);
      expect(result?.id).toBe(operationId);
    });
  });

  describe('save', () => {
    it('should insert new operation when not exists', async () => {
      const domain = Operation.create({
        meetingId: 'meeting-1',
        type: 'MONTHLY_PAYMENT',
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

