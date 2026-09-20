import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TypeOrmLoanRepository } from './typeorm-loan.repository';
import { Loan as LoanEntity } from '../entities/loan.entity';
import { Loan as LoanDomain } from '@domain/entities/loan.entity';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

describe('TypeOrmLoanRepository', () => {
  let repository: TypeOrmLoanRepository;
  let typeOrmRepo: jest.Mocked<Repository<LoanEntity>>;
  let updateSpy: jest.SpyInstance;
  let countSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    const mockTransactionManager = {
      execute: jest.fn(),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmLoanRepository,
        {
          provide: getRepositoryToken(LoanEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmLoanRepository>(TypeOrmLoanRepository);
    typeOrmRepo = module.get(getRepositoryToken(LoanEntity));

    // Create spies to avoid 'this' scoping issues
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
    countSpy = jest.spyOn(typeOrmRepo, 'count');
  });

  describe('findById', () => {
    it('should return Loan when found', async () => {
      const loanId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<LoanEntity> = {
        id: loanId,
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        disbursedAmount: 0,
        outstandingBalance: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
        status: 'pending',
        creationDate: new Date('2024-01-15'),
        guaranteedStockId: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as LoanEntity);

      const result = await repository.findById(loanId);

      expect(result).toBeInstanceOf(LoanDomain);
      expect(result?.id).toBe(loanId);
    });

    it('should return null when not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findByMember', () => {
    it('should return array of loans', async () => {
      const entities: Partial<LoanEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          loanType: 'corriente',
          approvedAmount: 10000,
          disbursedAmount: 0,
          outstandingBalance: 10000,
          monthlyPaymentAmount: 500,
          interestRate: 0.02,
          term: 24,
          status: 'pending',
          creationDate: new Date(),
          guaranteedStockId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LoanEntity[]);
      const result = await repository.findByMember('member-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LoanDomain);
    });
  });

  describe('save', () => {
    it('should insert new loan when not exists', async () => {
      const domain = LoanDomain.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        memberId: domain.memberId,
        loanType: domain.loanType,
        approvedAmount: domain.approvedAmount,
        disbursedAmount: domain.disbursedAmount,
        outstandingBalance: domain.outstandingBalance,
        monthlyPaymentAmount: domain.monthlyPaymentAmount,
        interestRate: domain.interestRate,
        term: domain.term,
        status: domain.status,
        creationDate: domain.creationDate,
        guaranteedStockId: null,
      } as LoanEntity);

      const result = await repository.save(domain);
      expect(result).toBeInstanceOf(LoanDomain);
    });

    it('should update existing loan when exists', async () => {
      const domain = LoanDomain.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });

      const existingEntity: Partial<LoanEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        loanType: domain.loanType,
        approvedAmount: 5000,
        disbursedAmount: domain.disbursedAmount,
        outstandingBalance: domain.outstandingBalance,
        monthlyPaymentAmount: domain.monthlyPaymentAmount,
        interestRate: domain.interestRate,
        term: domain.term,
        status: domain.status,
        creationDate: domain.creationDate,
        guaranteedStockId: null,
      };

      const updatedEntity: Partial<LoanEntity> = {
        ...existingEntity,
        approvedAmount: 10000,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as LoanEntity)
        .mockResolvedValueOnce(updatedEntity as LoanEntity);
      typeOrmRepo.update.mockResolvedValue(
        undefined as unknown as UpdateResult,
      );

      const result = await repository.save(domain);
      expect(updateSpy).toHaveBeenCalledWith(domain.id, expect.any(Object));
      expect(result).toBeInstanceOf(LoanDomain);
    });

    it('should throw error when loan not found after update', async () => {
      const domain = LoanDomain.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });

      const existingEntity: Partial<LoanEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        loanType: domain.loanType,
        approvedAmount: 5000,
        disbursedAmount: domain.disbursedAmount,
        outstandingBalance: domain.outstandingBalance,
        monthlyPaymentAmount: domain.monthlyPaymentAmount,
        interestRate: domain.interestRate,
        term: domain.term,
        status: domain.status,
        creationDate: domain.creationDate,
        guaranteedStockId: null,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as LoanEntity)
        .mockResolvedValueOnce(null);
      typeOrmRepo.update.mockResolvedValue(
        undefined as unknown as UpdateResult,
      );

      await expect(repository.save(domain)).rejects.toThrow(
        'Loan not found after update',
      );
    });
  });

  describe('findAll', () => {
    it('should return array of all loans', async () => {
      const entities: Partial<LoanEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          loanType: 'corriente',
          approvedAmount: 10000,
          disbursedAmount: 0,
          outstandingBalance: 10000,
          monthlyPaymentAmount: 500,
          interestRate: 0.02,
          term: 24,
          status: 'pending',
          creationDate: new Date(),
          guaranteedStockId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LoanEntity[]);
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LoanDomain);
    });
  });

  describe('findActiveByMember', () => {
    it('should return array of active loans for member', async () => {
      const memberId = 'member-1';
      const entities: Partial<LoanEntity>[] = [
        {
          id: '1',
          memberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          disbursedAmount: 0,
          outstandingBalance: 10000,
          monthlyPaymentAmount: 500,
          interestRate: 0.02,
          term: 24,
          status: 'active',
          creationDate: new Date(),
          guaranteedStockId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LoanEntity[]);
      const result = await repository.findActiveByMember(memberId);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LoanDomain);
    });
  });

  describe('findPendingByMember', () => {
    it('should return array of pending loans for member', async () => {
      const memberId = 'member-1';
      const entities: Partial<LoanEntity>[] = [
        {
          id: '1',
          memberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          disbursedAmount: 0,
          outstandingBalance: 10000,
          monthlyPaymentAmount: 500,
          interestRate: 0.02,
          term: 24,
          status: 'pending',
          creationDate: new Date(),
          guaranteedStockId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LoanEntity[]);
      const result = await repository.findPendingByMember(memberId);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LoanDomain);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('findByIds', () => {
    it('should return array of loans by ids', async () => {
      const loanIds = ['loan-1', 'loan-2'];
      const entities: Partial<LoanEntity>[] = [
        {
          id: 'loan-1',
          memberId: 'member-1',
          loanType: 'corriente',
          approvedAmount: 10000,
          disbursedAmount: 0,
          outstandingBalance: 10000,
          monthlyPaymentAmount: 500,
          interestRate: 0.02,
          term: 24,
          status: 'pending',
          creationDate: new Date(),
          guaranteedStockId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LoanEntity[]);
      const result = await repository.findByIds(loanIds);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LoanDomain);
    });
  });

  describe('hasActiveLoansByType', () => {
    it('should return true when count of active/pending loans is greater than 0', async () => {
      // ARRANGE
      typeOrmRepo.count.mockResolvedValue(2);

      // ACT
      const result = await repository.hasActiveLoansByType('corriente');

      // ASSERT
      expect(result).toBe(true);
      expect(countSpy).toHaveBeenCalledWith({
        where: {
          loanType: 'corriente',
          status: expect.anything() as unknown,
        },
      });
    });

    it('should return false when count of active/pending loans is 0', async () => {
      // ARRANGE
      typeOrmRepo.count.mockResolvedValue(0);

      // ACT
      const result = await repository.hasActiveLoansByType('inactivo');

      // ASSERT
      expect(result).toBe(false);
    });
  });
});
