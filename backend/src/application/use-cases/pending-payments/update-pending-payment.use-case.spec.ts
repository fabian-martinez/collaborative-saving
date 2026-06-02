import { UpdatePendingPaymentUseCase } from './update-pending-payment.use-case';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import {
  PendingMemberPayment,
  PendingMemberPaymentStatus,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { UpdatePendingPaymentDto } from '@application/dto/pending-payments/update-pending-payment.dto';

describe('UpdatePendingPaymentUseCase', () => {
  let useCase: UpdatePendingPaymentUseCase;
  let repository: jest.Mocked<PendingMemberPaymentRepository>;
  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      findByReference: jest.fn(),
      findWithFilters: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      calculateRemainingAmount: jest.fn(),
      delete: jest.fn(),
    };

    findByIdSpy = jest.spyOn(repository, 'findById');
    saveSpy = jest.spyOn(repository, 'save');

    useCase = new UpdatePendingPaymentUseCase(repository);
  });

  describe('execute', () => {
    it('should update amount and notes successfully', async () => {
      // Arrange
      const date = new Date();
      const payment = new PendingMemberPayment(
        '1',
        'm-1',
        'mtg-1',
        PendingMemberPaymentType.LOAN,
        100,
        PendingMemberPaymentStatus.PENDING,
        date,
      );

      findByIdSpy.mockResolvedValue(payment);

      const dto: UpdatePendingPaymentDto = {
        amount: 150,
        notes: 'Updated notes',
      };

      // Act
      await useCase.execute('1', dto);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith('1');
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(payment.amount).toBe(150);
      expect(payment.notes).toBe('Updated notes');
      expect(payment.status).toBe(PendingMemberPaymentStatus.PENDING);
    });

    it('should change status to APPROVED', async () => {
      // Arrange
      const payment = PendingMemberPayment.create({
        memberId: 'm-1',
        meetingId: 'mtg-1',
        type: PendingMemberPaymentType.OTHER,
        amount: 50,
      });

      findByIdSpy.mockResolvedValue(payment);

      const dto: UpdatePendingPaymentDto = {
        status: PendingMemberPaymentStatus.APPROVED,
      };

      // Act
      await useCase.execute(payment.id, dto);

      // Assert
      expect(payment.status).toBe(PendingMemberPaymentStatus.APPROVED);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should change status to REJECTED', async () => {
      // Arrange
      const payment = PendingMemberPayment.create({
        memberId: 'm-1',
        meetingId: 'mtg-1',
        type: PendingMemberPaymentType.OTHER,
        amount: 50,
      });

      findByIdSpy.mockResolvedValue(payment);

      const dto: UpdatePendingPaymentDto = {
        status: PendingMemberPaymentStatus.REJECTED,
      };

      // Act
      await useCase.execute(payment.id, dto);

      // Assert
      expect(payment.status).toBe(PendingMemberPaymentStatus.REJECTED);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw Error when payment is not found', async () => {
      // Arrange
      findByIdSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('invalid-id', { amount: 100 }),
      ).rejects.toThrow('PendingMemberPayment with ID invalid-id not found');
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
