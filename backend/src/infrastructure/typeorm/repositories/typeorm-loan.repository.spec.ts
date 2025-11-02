import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TypeOrmLoanRepository } from './typeorm-loan.repository';
import { Loan as LoanEntity } from '../entities/loan.entity';
import { Loan as LoanDomain } from '@domain/entities/loan.entity';

describe('TypeOrmLoanRepository', () => {
  let repository: TypeOrmLoanRepository;
  let typeOrmRepo: jest.Mocked<Repository<LoanEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmLoanRepository,
        {
          provide: getRepositoryToken(LoanEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmLoanRepository>(TypeOrmLoanRepository);
    typeOrmRepo = module.get(getRepositoryToken(LoanEntity));
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
  });
});
