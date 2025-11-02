import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmLedgerEntryRepository } from './typeorm-ledger-entry.repository';
import { LedgerEntry as LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { LedgerEntry as LedgerEntryDomain } from '@domain/entities/ledger-entry.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';

describe('TypeOrmLedgerEntryRepository', () => {
  let repository: TypeOrmLedgerEntryRepository;
  let typeOrmRepo: jest.Mocked<Repository<LedgerEntryEntity>>;
  let operationRepo: jest.Mocked<Repository<OperationEntity>>;

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
    operationRepo = module.get(getRepositoryToken(OperationEntity));
  });

  describe('findById', () => {
    it('should return LedgerEntry when found', async () => {
      const entryId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<LedgerEntryEntity> = {
        id: entryId,
        operationId: 'operation-1',
        accountType: 'cash',
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
          accountType: 'cash',
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
        accountType: 'cash',
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
  });
});
