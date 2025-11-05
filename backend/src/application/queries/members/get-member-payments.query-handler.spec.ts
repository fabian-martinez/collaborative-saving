import { GetMemberPaymentsQueryHandler } from './get-member-payments.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { Member } from '@domain/entities/member.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { PaymentFilterType } from '@domain/enums/payment-filter-type.enum';
import { OperationType } from '@domain/enums/operation-type.enum';
import { PaymentType } from '@domain/enums/payment-type.enum';
import { CASH_ACCOUNT } from '@domain/constants/account-types';

describe('GetMemberPaymentsQueryHandler', () => {
  let queryHandler: GetMemberPaymentsQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let paymentMapperService: jest.Mocked<PaymentMapperService>;

  beforeEach(() => {
    // Mock MemberRepository
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    // Mock OperationRepository
    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMember: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    // Mock LedgerEntryRepository
    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    // Mock PaymentMapperService
    paymentMapperService = {
      calculatePaymentTotalAmount: jest.fn(),
      mapPaymentFilterToOperationTypes: jest.fn(),
      mapOperationTypeToPaymentType: jest.fn(),
    } as unknown as jest.Mocked<PaymentMapperService>;

    queryHandler = new GetMemberPaymentsQueryHandler(
      memberRepository,
      operationRepository,
      ledgerEntryRepository,
      paymentMapperService,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '660e8400-e29b-41d4-a716-446655440001';

    it('should throw error when member not found', async () => {
      // ARRANGE
      memberRepository.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        queryHandler.execute(memberId, { paymentType: undefined }),
      ).rejects.toThrow(MemberNotFoundException);

      expect(memberRepository.findById.mock.calls[0][0]).toBe(memberId);
    });

    it('should return empty array when no operations found', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      memberRepository.findById.mockResolvedValue(member);
      operationRepository.findByMember.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(memberId, {
        paymentType: undefined,
      });

      // ASSERT
      expect(result).toEqual([]);
      expect(memberRepository.findById.mock.calls[0][0]).toBe(memberId);
      expect(operationRepository.findByMember.mock.calls[0][0]).toBe(memberId);
      expect(operationRepository.findByMember.mock.calls[0][1]).toEqual({
        meetingId: undefined,
        types: undefined,
      });
      expect(
        paymentMapperService.mapPaymentFilterToOperationTypes.mock.calls.length,
      ).toBe(0);
    });

    it('should return payments with entries for monthly payment filter', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      memberRepository.findById.mockResolvedValue(member);

      const operation = Operation.fromPersistence({
        id: 'op-1',
        member_id: memberId,
        meeting_id: meetingId,
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Monthly payment',
      });

      const entry1 = LedgerEntry.fromPersistence({
        id: 'entry-1',
        operation_id: 'op-1',
        account_type: CASH_ACCOUNT,
        amount: 1000,
        created_at: new Date(),
        description: 'Cash entry',
        loan_id: null,
        stock_id: null,
        mandatory_contribution_id: null,
        stock_subscription_id: null,
      });

      const entry2 = LedgerEntry.fromPersistence({
        id: 'entry-2',
        operation_id: 'op-1',
        account_type: 'MANDATORY_CONTRIBUTION_INCOME',
        amount: -1000,
        created_at: new Date(),
        description: 'Income entry',
        loan_id: null,
        stock_id: null,
        mandatory_contribution_id: 'mc-1',
        stock_subscription_id: null,
      });

      operationRepository.findByMember.mockResolvedValue([operation]);
      ledgerEntryRepository.findByOperations.mockResolvedValue([
        entry1,
        entry2,
      ]);
      paymentMapperService.mapPaymentFilterToOperationTypes.mockReturnValue([
        OperationType.MONTHLY_PAYMENT,
        OperationType.MANDATORY_CONTRIBUTION,
      ]);
      paymentMapperService.mapOperationTypeToPaymentType.mockReturnValue(
        PaymentType.MANDATORY_CONTRIBUTION,
      );
      paymentMapperService.calculatePaymentTotalAmount.mockReturnValue(1000);

      // ACT
      const result = await queryHandler.execute(memberId, {
        paymentType: PaymentFilterType.MONTHLY_PAYMENT,
      });

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].operationId).toBe('op-1');
      expect(result[0].type).toBe(PaymentType.MANDATORY_CONTRIBUTION);
      expect(result[0].totalAmount).toBe(1000);
      expect(result[0].entries).toHaveLength(2);
      expect(result[0].entries[0].id).toBe('entry-1');
      expect(result[0].entries[1].id).toBe('entry-2');
      expect(
        paymentMapperService.mapPaymentFilterToOperationTypes.mock.calls[0][0],
      ).toBe(PaymentFilterType.MONTHLY_PAYMENT);
      expect(
        paymentMapperService.mapOperationTypeToPaymentType.mock.calls[0][0],
      ).toBe(OperationType.MONTHLY_PAYMENT);
      expect(
        paymentMapperService.calculatePaymentTotalAmount.mock.calls[0][0],
      ).toEqual([entry1, entry2]);
    });

    it('should filter by meetingId when provided', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      memberRepository.findById.mockResolvedValue(member);
      operationRepository.findByMember.mockResolvedValue([]);

      // ACT
      await queryHandler.execute(memberId, {
        paymentType: undefined,
        meetingId,
      });

      // ASSERT
      expect(operationRepository.findByMember.mock.calls[0][0]).toBe(memberId);
      expect(operationRepository.findByMember.mock.calls[0][1]).toEqual({
        meetingId,
        types: undefined,
      });
      expect(
        paymentMapperService.mapPaymentFilterToOperationTypes.mock.calls.length,
      ).toBe(0);
    });

    it('should calculate totalAmount from CASH_ACCOUNT entries with positive amounts', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      memberRepository.findById.mockResolvedValue(member);

      const operation = Operation.fromPersistence({
        id: 'op-1',
        member_id: memberId,
        meeting_id: meetingId,
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Monthly payment',
      });

      const entry1 = LedgerEntry.fromPersistence({
        id: 'entry-1',
        operation_id: 'op-1',
        account_type: CASH_ACCOUNT,
        amount: 1500,
        created_at: new Date(),
      });

      const entry2 = LedgerEntry.fromPersistence({
        id: 'entry-2',
        operation_id: 'op-1',
        account_type: CASH_ACCOUNT,
        amount: -500, // Negative amount should be ignored
        created_at: new Date(),
      });

      const entry3 = LedgerEntry.fromPersistence({
        id: 'entry-3',
        operation_id: 'op-1',
        account_type: 'OTHER_EXPENSES',
        amount: 2000, // Not CASH_ACCOUNT, should be ignored
        created_at: new Date(),
      });

      operationRepository.findByMember.mockResolvedValue([operation]);
      ledgerEntryRepository.findByOperations.mockResolvedValue([
        entry1,
        entry2,
        entry3,
      ]);
      paymentMapperService.mapOperationTypeToPaymentType.mockReturnValue(
        PaymentType.MANDATORY_CONTRIBUTION,
      );
      paymentMapperService.calculatePaymentTotalAmount.mockReturnValue(1500);

      // ACT
      const result = await queryHandler.execute(memberId, {
        paymentType: undefined,
      });

      // ASSERT
      expect(result[0].totalAmount).toBe(1500);
      expect(
        paymentMapperService.calculatePaymentTotalAmount.mock.calls[0][0],
      ).toEqual([entry1, entry2, entry3]);
    });
  });
});
