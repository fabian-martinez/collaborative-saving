import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmLoanTransactionDetailRepository } from './typeorm-loan-transaction-detail.repository';
import { LoanTransactionDetail as LoanTransactionDetailEntity } from '../entities/loan-transaction-detail.entity';
import {
  LoanTransactionDetail as LoanTransactionDetailDomain,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
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

      typeOrmRepo.findOne.mockResolvedValue(
        entity as LoanTransactionDetailEntity,
      );
      const result = await repository.findById(transactionId);

      expect(result).toBeInstanceOf(LoanTransactionDetailDomain);
      expect(result?.id).toBe(transactionId);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: transactionId },
      });
    });

    it('should return null when not found', async () => {
      const transactionId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(transactionId);

      expect(result).toBeNull();
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

      typeOrmRepo.find.mockResolvedValue(
        entities as LoanTransactionDetailEntity[],
      );
      const result = await repository.findByLoan('loan-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LoanTransactionDetailDomain);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { loanId: 'loan-1' },
      });
    });

    it('should return empty array when no transactions found', async () => {
      typeOrmRepo.find.mockResolvedValue([]);
      const result = await repository.findByLoan('loan-1');
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('findByLoanAndMeeting', () => {
    it('should return array of transactions for loan and meeting', async () => {
      const entities: Partial<LoanTransactionDetailEntity>[] = [
        {
          id: '1',
          loanId: 'loan-1',
          transactionType: 'principal_payment',
          amount: 500,
          transactionDate: new Date(),
          notes: null,
          operationId: 'operation-1',
        },
      ];

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(
          entities as LoanTransactionDetailEntity[],
        ),
      };

      typeOrmRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findByLoanAndMeeting('loan-1', 'meeting-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LoanTransactionDetailDomain);
      expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith(
        'loan_transaction_detail',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'operations',
        'operation',
        'operation.id = loan_transaction_detail.operation_id AND operation.meeting_id = :meetingId',
        { meetingId: 'meeting-1' },
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'loan_transaction_detail.loan_id = :loanId',
        { loanId: 'loan-1' },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return empty array when no transactions found', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      typeOrmRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findByLoanAndMeeting('loan-1', 'meeting-1');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
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
      expect(typeOrmRepo.save).toHaveBeenCalled();
    });

    it('should update existing transaction when exists', async () => {
      const domain = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });

      const existingEntity: Partial<LoanTransactionDetailEntity> = {
        id: domain.id,
        loanId: 'loan-1',
        transactionType: 'principal_payment',
        amount: 500,
        transactionDate: new Date(),
        notes: null,
        operationId: null,
      };

      const updatedEntity: Partial<LoanTransactionDetailEntity> = {
        ...existingEntity,
        amount: 600,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as LoanTransactionDetailEntity)
        .mockResolvedValueOnce(updatedEntity as LoanTransactionDetailEntity);
      typeOrmRepo.update.mockResolvedValue(undefined as any);

      const result = await repository.save(domain);

      expect(result).toBeInstanceOf(LoanTransactionDetailDomain);
      expect(typeOrmRepo.update).toHaveBeenCalledWith(
        domain.id,
        expect.any(Object),
      );
      expect(typeOrmRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error when transaction not found after update', async () => {
      const domain = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });

      const existingEntity: Partial<LoanTransactionDetailEntity> = {
        id: domain.id,
        loanId: 'loan-1',
        transactionType: 'principal_payment',
        amount: 500,
        transactionDate: new Date(),
        notes: null,
        operationId: null,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as LoanTransactionDetailEntity)
        .mockResolvedValueOnce(null);
      typeOrmRepo.update.mockResolvedValue(undefined as any);

      await expect(repository.save(domain)).rejects.toThrow(
        'LoanTransactionDetail not found after update',
      );
    });
  });

  describe('saveMany', () => {
    it('should save multiple transactions', async () => {
      const domain1 = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });

      const domain2 = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.INTEREST_PAYMENT,
        amount: 100,
      });

      const savedEntities: Partial<LoanTransactionDetailEntity>[] = [
        {
          id: domain1.id,
          loanId: domain1.loanId,
          transactionType: domain1.transactionType,
          amount: domain1.amount,
          transactionDate: domain1.transactionDate,
          notes: null,
          operationId: null,
        },
        {
          id: domain2.id,
          loanId: domain2.loanId,
          transactionType: domain2.transactionType,
          amount: domain2.amount,
          transactionDate: domain2.transactionDate,
          notes: null,
          operationId: null,
        },
      ];

      (typeOrmRepo.save as jest.Mock).mockImplementation(async (input: any) => {
        if (Array.isArray(input)) {
          return savedEntities as LoanTransactionDetailEntity[];
        }
        return savedEntities[0] as LoanTransactionDetailEntity;
      });

      const result = await repository.saveMany([domain1, domain2]);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(LoanTransactionDetailDomain);
      expect(result[1]).toBeInstanceOf(LoanTransactionDetailDomain);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: domain1.id }),
          expect.objectContaining({ id: domain2.id }),
        ]),
      );
    });

    it('should return empty array when saving empty array', async () => {
      (typeOrmRepo.save as jest.Mock).mockImplementation(async (input: any) => {
        if (Array.isArray(input)) {
          return [];
        }
        return {} as LoanTransactionDetailEntity;
      });

      const result = await repository.saveMany([]);
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });
});
