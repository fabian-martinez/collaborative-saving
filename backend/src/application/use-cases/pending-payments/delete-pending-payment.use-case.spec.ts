import { DeletePendingPaymentUseCase } from './delete-pending-payment.use-case';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import {
  PendingMemberPayment,
  PendingMemberPaymentStatus,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';

describe('DeletePendingPaymentUseCase', () => {
  let useCase: DeletePendingPaymentUseCase;
  let repository: jest.Mocked<PendingMemberPaymentRepository>;
  let findByIdSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      findByReference: jest.fn(),
      findWithFilters: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      calculateRemainingAmount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    findByIdSpy = jest.spyOn(repository, 'findById');
    deleteSpy = jest.spyOn(repository, 'delete');

    useCase = new DeletePendingPaymentUseCase(repository);
  });

  describe('execute', () => {
    it('should delete a pending payment successfully', async () => {
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
      deleteSpy.mockResolvedValue(undefined);

      // Act
      await useCase.execute('1');

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith('1');
      expect(deleteSpy).toHaveBeenCalledWith('1');
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw Error when payment is not found', async () => {
      // Arrange
      findByIdSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('invalid-id')).rejects.toThrow(
        'PendingMemberPayment with ID invalid-id not found',
      );
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should throw Error when trying to delete a PAID payment', async () => {
      // Arrange
      const payment = PendingMemberPayment.create({
        memberId: 'm-1',
        meetingId: 'mtg-1',
        type: PendingMemberPaymentType.OTHER,
        amount: 50,
      });
      // simulate it was paid
      payment.approve();
      payment.markAsPaid();

      findByIdSpy.mockResolvedValue(payment);

      // Act & Assert
      await expect(useCase.execute(payment.id)).rejects.toThrow(
        'Cannot delete a paid PendingMemberPayment',
      );
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
