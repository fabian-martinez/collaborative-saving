import { GetPendingPaymentsQueryHandler } from './get-pending-payments.query-handler';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { GetPendingPaymentsQueryDto } from '@application/dto/pending-payments/get-pending-payments-query.dto';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
  PendingMemberPaymentStatus,
} from '@domain/entities/pending-member-payment.entity';
import { Member } from '@domain/entities/member.entity';

describe('GetPendingPaymentsQueryHandler', () => {
  let queryHandler: GetPendingPaymentsQueryHandler;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let findWithFiltersSpy: jest.SpyInstance;
  let findByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    pendingMemberPaymentRepository = {
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
    };

    memberRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    findWithFiltersSpy = jest.spyOn(
      pendingMemberPaymentRepository,
      'findWithFilters',
    );
    findByIdSpy = jest.spyOn(memberRepository, 'findById');

    queryHandler = new GetPendingPaymentsQueryHandler(
      pendingMemberPaymentRepository,
      memberRepository,
    );
  });

  describe('execute', () => {
    it('should return empty array if no pending payments exist', async () => {
      // Arrange
      findWithFiltersSpy.mockResolvedValue([]);
      const query: GetPendingPaymentsQueryDto = {};

      // Act
      const result = await queryHandler.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(findWithFiltersSpy).toHaveBeenCalledWith({
        status: undefined,
        memberId: undefined,
        meetingId: undefined,
        type: undefined,
      });
      expect(findByIdSpy).not.toHaveBeenCalled();
    });

    it('should return pending payments and fetch member names', async () => {
      // Arrange
      const date = new Date();
      const paymentDomain = new PendingMemberPayment(
        '1',
        'm-1',
        'mtg-1',
        PendingMemberPaymentType.DIVIDEND,
        100,
        PendingMemberPaymentStatus.PENDING,
        date,
      );

      const member = {
        id: 'm-1',
        name: 'John Doe',
      } as unknown as Member;

      findWithFiltersSpy.mockResolvedValue([paymentDomain]);
      findByIdSpy.mockResolvedValue(member);

      const query: GetPendingPaymentsQueryDto = {
        status: PendingMemberPaymentStatus.PENDING,
      };

      // Act
      const result = await queryHandler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        memberId: 'm-1',
        meetingId: 'mtg-1',
        type: 'dividend',
        amount: 100,
        status: 'pending',
        notes: undefined,
        createdAt: date,
        referenceMeetingId: undefined,
        stockId: undefined,
        loanId: undefined,
        stockSubscriptionId: undefined,
        disbursementType: undefined,
        memberName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(findWithFiltersSpy).toHaveBeenCalledWith({
        status: 'pending',
        memberId: undefined,
        meetingId: undefined,
        type: undefined,
      });
      expect(findByIdSpy).toHaveBeenCalledWith('m-1');
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle member not found gracefully', async () => {
      // Arrange
      const paymentDomain = PendingMemberPayment.create({
        memberId: 'm-missing',
        meetingId: 'mtg-1',
        type: PendingMemberPaymentType.LOAN,
        amount: 50,
      });

      findWithFiltersSpy.mockResolvedValue([paymentDomain]);
      findByIdSpy.mockResolvedValue(null);

      // Act
      const result = await queryHandler.execute({});

      // Assert
      expect(result[0].memberName).toBeUndefined();
      expect(result[0].firstName).toBeUndefined();
      expect(result[0].lastName).toBeUndefined();
    });
  });
});
