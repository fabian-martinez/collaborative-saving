import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { TypeOrmPendingMemberPaymentRepository } from './typeorm-pending-member-payment.repository';
import { PendingMemberPayment as PendingMemberPaymentEntity } from '../entities/pending-member-payment.entity';
import {
  PendingMemberPayment as PendingMemberPaymentDomain,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';

describe('TypeOrmPendingMemberPaymentRepository', () => {
  let repository: TypeOrmPendingMemberPaymentRepository;
  let typeOrmRepo: jest.Mocked<Repository<PendingMemberPaymentEntity>>;
  let updateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionManager = {
      execute: jest.fn(),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmPendingMemberPaymentRepository,
        {
          provide: getRepositoryToken(PendingMemberPaymentEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: TransactionManager,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmPendingMemberPaymentRepository>(
      TypeOrmPendingMemberPaymentRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(PendingMemberPaymentEntity));

    // Create spies to avoid 'this' scoping issues
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
  });

  describe('findById', () => {
    it('should return PendingMemberPayment when found', async () => {
      const paymentId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: Partial<PendingMemberPaymentEntity> = {
        id: paymentId,
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: 'dividend',
        amount: 1000,
        status: 'pending',
        notes: null,
        stockId: null,
        loanId: null,
        stockSubscriptionId: null,
        referenceMeetingId: null,
        disbursementType: null,
        createdAt: new Date(),
      };

      typeOrmRepo.findOne.mockResolvedValue(
        entity as PendingMemberPaymentEntity,
      );
      const result = await repository.findById(paymentId);

      expect(result).toBeInstanceOf(PendingMemberPaymentDomain);
      expect(result?.id).toBe(paymentId);
    });
  });

  describe('findByMember', () => {
    it('should return array of payments', async () => {
      const entities: Partial<PendingMemberPaymentEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          meetingId: 'meeting-1',
          type: 'dividend',
          amount: 1000,
          status: 'pending',
          notes: null,
          stockId: null,
          loanId: null,
          stockSubscriptionId: null,
          referenceMeetingId: null,
          disbursementType: null,
          createdAt: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(
        entities as PendingMemberPaymentEntity[],
      );
      const result = await repository.findByMember('member-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PendingMemberPaymentDomain);
    });
  });

  describe('save', () => {
    it('should insert new payment when not exists', async () => {
      const domain = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      typeOrmRepo.findOne.mockResolvedValue(null);
      typeOrmRepo.save.mockResolvedValue({
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        amount: domain.amount,
        status: domain.status,
        notes: null,
        stockId: null,
        loanId: null,
        stockSubscriptionId: null,
        referenceMeetingId: null,
        disbursementType: null,
        createdAt: domain.createdAt,
      } as PendingMemberPaymentEntity);

      const result = await repository.save(domain);
      expect(result).toBeInstanceOf(PendingMemberPaymentDomain);
    });

    it('should update existing payment when exists', async () => {
      const domain = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      const existingEntity: Partial<PendingMemberPaymentEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        amount: 500,
        status: domain.status,
        notes: null,
        stockId: null,
        loanId: null,
        stockSubscriptionId: null,
        referenceMeetingId: null,
        disbursementType: null,
        createdAt: domain.createdAt,
      };

      const updatedEntity: Partial<PendingMemberPaymentEntity> = {
        ...existingEntity,
        amount: 1000,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as PendingMemberPaymentEntity)
        .mockResolvedValueOnce(updatedEntity as PendingMemberPaymentEntity);
      typeOrmRepo.update.mockResolvedValue({
        raw: [],
        generatedMaps: [],
        affected: 1,
      } as UpdateResult);

      const result = await repository.save(domain);
      expect(updateSpy).toHaveBeenCalledWith(domain.id, expect.any(Object));
      expect(result).toBeInstanceOf(PendingMemberPaymentDomain);
    });

    it('should throw error when payment not found after update', async () => {
      const domain = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      const existingEntity: Partial<PendingMemberPaymentEntity> = {
        id: domain.id,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        amount: 500,
        status: domain.status,
        notes: null,
        stockId: null,
        loanId: null,
        stockSubscriptionId: null,
        referenceMeetingId: null,
        disbursementType: null,
        createdAt: domain.createdAt,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity as PendingMemberPaymentEntity)
        .mockResolvedValueOnce(null);
      typeOrmRepo.update.mockResolvedValue({
        raw: [],
        generatedMaps: [],
        affected: 1,
      } as UpdateResult);

      await expect(repository.save(domain)).rejects.toThrow(
        'PendingMemberPayment not found after update',
      );
    });
  });

  describe('findByMeeting', () => {
    it('should return array of payments for meeting', async () => {
      const meetingId = 'meeting-1';
      const entities: Partial<PendingMemberPaymentEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          meetingId,
          type: 'dividend',
          amount: 1000,
          status: 'pending',
          notes: null,
          stockId: null,
          loanId: null,
          stockSubscriptionId: null,
          referenceMeetingId: null,
          disbursementType: null,
          createdAt: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(
        entities as PendingMemberPaymentEntity[],
      );
      const result = await repository.findByMeeting(meetingId);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PendingMemberPaymentDomain);
      expect(result[0].meetingId).toBe(meetingId);
    });

    it('should return empty array when no payments found', async () => {
      const meetingId = 'meeting-1';
      typeOrmRepo.find.mockResolvedValue([]);
      const result = await repository.findByMeeting(meetingId);
      expect(result).toEqual([]);
    });
  });

  describe('findPendingByMeeting', () => {
    it('should return array of pending payments', async () => {
      const meetingId = 'meeting-1';
      const entities: Partial<PendingMemberPaymentEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          meetingId,
          type: 'dividend',
          amount: 1000,
          status: 'pending',
          notes: null,
          stockId: null,
          loanId: null,
          stockSubscriptionId: null,
          referenceMeetingId: null,
          disbursementType: null,
          createdAt: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(
        entities as PendingMemberPaymentEntity[],
      );
      const result = await repository.findPendingByMeeting(meetingId);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PendingMemberPaymentDomain);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('findByReference', () => {
    it('should return array of payments by reference meeting', async () => {
      const referenceMeetingId = 'meeting-ref-1';
      const entities: Partial<PendingMemberPaymentEntity>[] = [
        {
          id: '1',
          memberId: 'member-1',
          meetingId: 'meeting-1',
          referenceMeetingId,
          type: 'dividend',
          amount: 1000,
          status: 'pending',
          notes: null,
          stockId: null,
          loanId: null,
          stockSubscriptionId: null,
          disbursementType: null,
          createdAt: new Date(),
        },
      ];

      typeOrmRepo.find.mockResolvedValue(
        entities as PendingMemberPaymentEntity[],
      );
      const result = await repository.findByReference(referenceMeetingId);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PendingMemberPaymentDomain);
    });
  });

  describe('saveMany', () => {
    it('should save multiple payments', async () => {
      const domain1 = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      const domain2 = PendingMemberPayment.create({
        memberId: 'member-2',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.LOAN,
        amount: 500,
      });

      const entities: Partial<PendingMemberPaymentEntity>[] = [
        {
          id: domain1.id,
          memberId: domain1.memberId,
          meetingId: domain1.meetingId,
          type: domain1.type,
          amount: domain1.amount,
          status: domain1.status,
          notes: null,
          stockId: null,
          loanId: null,
          stockSubscriptionId: null,
          referenceMeetingId: null,
          disbursementType: null,
          createdAt: domain1.createdAt,
        },
        {
          id: domain2.id,
          memberId: domain2.memberId,
          meetingId: domain2.meetingId,
          type: domain2.type,
          amount: domain2.amount,
          status: domain2.status,
          notes: null,
          stockId: null,
          loanId: null,
          stockSubscriptionId: null,
          referenceMeetingId: null,
          disbursementType: null,
          createdAt: domain2.createdAt,
        },
      ];

      (typeOrmRepo.save as jest.Mock).mockImplementation((input: unknown) => {
        if (Array.isArray(input)) {
          return Promise.resolve(entities as PendingMemberPaymentEntity[]);
        }
        return Promise.resolve(entities[0] as PendingMemberPaymentEntity);
      });
      const result = await repository.saveMany([domain1, domain2]);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PendingMemberPaymentDomain);
      expect(result[1]).toBeInstanceOf(PendingMemberPaymentDomain);
    });
  });

  describe('calculateRemainingAmount', () => {
    it('should return payment amount when payment exists', async () => {
      const paymentId = 'payment-1';
      const domain = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      const entity: Partial<PendingMemberPaymentEntity> = {
        id: paymentId,
        memberId: domain.memberId,
        meetingId: domain.meetingId,
        type: domain.type,
        amount: domain.amount,
        status: domain.status,
        notes: null,
        stockId: null,
        loanId: null,
        stockSubscriptionId: null,
        referenceMeetingId: null,
        disbursementType: null,
        createdAt: domain.createdAt,
      };

      typeOrmRepo.findOne.mockResolvedValue(
        entity as PendingMemberPaymentEntity,
      );
      const result = await repository.calculateRemainingAmount(paymentId);
      expect(result).toBe(1000);
    });

    it('should throw error when payment not found', async () => {
      const paymentId = 'non-existent';
      typeOrmRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.calculateRemainingAmount(paymentId),
      ).rejects.toThrow('PendingMemberPayment not found');
    });
  });
});
