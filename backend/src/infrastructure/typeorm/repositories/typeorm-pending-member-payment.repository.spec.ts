import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmPendingMemberPaymentRepository } from './typeorm-pending-member-payment.repository';
import { PendingMemberPayment as PendingMemberPaymentEntity } from '../entities/pending-member-payment.entity';
import {
  PendingMemberPayment as PendingMemberPaymentDomain,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';

describe('TypeOrmPendingMemberPaymentRepository', () => {
  let repository: TypeOrmPendingMemberPaymentRepository;
  let typeOrmRepo: jest.Mocked<Repository<PendingMemberPaymentEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmPendingMemberPaymentRepository,
        {
          provide: getRepositoryToken(PendingMemberPaymentEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmPendingMemberPaymentRepository>(
      TypeOrmPendingMemberPaymentRepository,
    );
    typeOrmRepo = module.get(getRepositoryToken(PendingMemberPaymentEntity));
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
  });
});

