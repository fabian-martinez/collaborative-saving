import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmLoanTransactionDetailRepository } from './typeorm-loan-transaction-detail.repository';
import { LoanTransactionDetail as LoanTransactionDetailEntity } from '../entities/loan-transaction-detail.entity';
import { LoanTransactionDetail as LoanTransactionDetailDomain, LoanTransactionType } from '@domain/entities/loan-transaction-detail.entity';
import { LoanTransactionDetail } from '@domain/entities/loan-transaction-detail.entity';

describe('TypeOrmLoanTransactionDetailRepository', () => {
  let repository: TypeOrmLoanTransactionDetailRepository;
  let typeOrmRepo: jest.Mocked<Repository<LoanTransactionDetailEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmLoanTransactionDetailRepository,
        {
          provide: getRepositoryToken(LoanTransactionDetailEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmLoanTransactionDetailRepository>(
      TypeOrmLoanTransactionDetailRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(LoanTransactionDetailEntity));
  });

  describe('findById', () => {
    it('should return LoanTransactionDetail when found', async () => {
      const transactionId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<LoanTransactionDetailEntity> = {
        id: transactionId,
        loanId: 'loan-1',
        transactionType: 'principal_payment',
        amount: 500,
        transactionDate: new Date(),
        notes: null,
        operationId: null,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity as LoanTransactionDetailEntity);
      const result = await repository.findById(transactionId);

      expect(result).toBeInstanceOf(LoanTransactionDetailDomain);
      expect(result?.id).toBe(transactionId);
    });
  });

  describe('findByLoan', () => {
    it('should return array of transactions', async () => {
      const entities: Partial<LoanTransactionDetailEntity>[] = [
        {
          id: '1',
          loanId: 'loan-1',
          transactionType: 'principal_payment',
          amount: 500,
          transactionDate: new Date(),
          notes: null,
          operationId: null,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities as LoanTransactionDetailEntity[]);
      const result = await repository.findByLoan('loan-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('save', () => {
    it('should insert new transaction when not exists', async () => {
      const domain = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        loanId: domain.loanId,
        transactionType: domain.transactionType,
        amount: domain.amount,
        transactionDate: domain.transactionDate,
        notes: null,
        operationId: null,
      } as LoanTransactionDetailEntity);

      const result = await repository.save(domain);
      expect(result).toBeInstanceOf(LoanTransactionDetailDomain);
    });
  });
});

